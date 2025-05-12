// pages/api/ask.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import runTool, { SearchResult } from '../../lib/tool-executor';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ApiResponse = {
  reply?: string;
  error?: string;
};

type ChatResponse = {
  choices: { message: { role: string; content: string } }[];
};

const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
const DEFAULT_MODEL = process.env.GROQ_DEFAULT_MODEL || 'llama3-8b-8192';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!GROQ_API_KEY) {
    return res
      .status(500)
      .json({ error: 'Missing GROQ_API_KEY in environment' });
  }

  try {
    const { messages, model, timezone } = req.body as {
      messages?: Message[];
      model?: string;
      timezone?: string;
    };

    if (!messages?.length) {
      return res
        .status(400)
        .json({ error: 'Missing or invalid messages array' });
    }

    // ─── 1) System Prompts ─────────────────────────────────────────────────
    const tz = timezone || 'UTC';
    const today = new Date().toLocaleDateString('en-GB', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const dateMsg: Message = {
      role: 'system',
      content: `Current date (${tz}): **${today}**.`,
    };
    const markdownMsg: Message = {
      role: 'system',
      content: [
        'Please respond **in Markdown** only.',
        '- Use `##` for headings.',
        '- Use `1.` for numbered lists.',
        '- Use `-` for bullet points.',
        '',
        '```md',
        '## Example Heading',
        '1. **Point**: detail',
        '- **Note**: info',
        '```',
      ].join('\n'),
    };

    // ─── 2) Freshness & Complexity Detection ────────────────────────────────
    const lastText = messages[messages.length - 1].content.toLowerCase();
    const isFresh = /\b(today|latest|breaking|news|this week)\b/.test(lastText);
    const shouldDeepSeek = lastText.length > 50; // simple heuristic

    // ─── 3) Enrich with external tools ──────────────────────────────────────
    const enriched: Message[] = [dateMsg, markdownMsg];

    if (isFresh) {
      // 3a) Web search
      try {
        const webResults = (await runTool('search_web', {
          query: lastText,
          onlyRecent: true,
          numResults: 5,
        })) as SearchResult[];
        const webSnips = webResults
          .map((r, i) => `${i + 1}. **${r.title}**: ${r.snippet}`)
          .join('\n');
        enriched.push({
          role: 'system',
          content: `## Recent Web Results\n${webSnips}`,
        });
      } catch (e) {
        console.warn('[search_web] failed', e);
      }
    }

    if (shouldDeepSeek) {
      // 3b) DeepSeek R1
      try {
        const deepResults = (await runTool('deepseek_r1', {
          query: lastText,
          numResults: 5,      // use numResults here
        })) as SearchResult[];
        const deepSnips = deepResults
          .map((r, i) => `${i + 1}. **${r.title}**: ${r.snippet}`)
          .join('\n');
        enriched.push({
          role: 'system',
          content: `## DeepSeek Insights\n${deepSnips}`,
        });
      } catch (e) {
        console.warn('[deepseek_r1] failed', e);
      }
    }

    // ─── 4) Append original conversation ────────────────────────────────────
    enriched.push(...messages);

    // ─── 5) GROQ API Call ──────────────────────────────────────────────────
    const resp = await axios.post<ChatResponse>(
      GROQ_ENDPOINT,
      {
        model: model || DEFAULT_MODEL,
        messages: enriched,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = resp.data.choices?.[0]?.message?.content;
    if (!reply) throw new Error('No reply returned from GROQ API');
    return res.status(200).json({ reply });
  } catch (_err: unknown) {

  // let msg = 'Unknown error';
  // if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
  //   msg = err.response.data.error.message;
  // } else if (err instanceof Error) {
  //   msg = err.message;
  // }
  // console.error('[ask.ts] Groq Error:', msg);
  // return res.status(500).json({ error: `GROQ API Error: ${msg}` });
}

}
