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
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
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
    return res.status(500).json({ error: 'Missing GROQ_API_KEY in environment' });
  }

  try {
    const { messages, model, timezone } = req.body as {
      messages?: Message[];
      model?: string;
      timezone?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    const modelId = model || DEFAULT_MODEL;
    const lastUserText = messages[messages.length - 1].content.trim();

    // ──────────────────────────────────────────────────────────────────────────
    // If the user specifically selected DeepSeek R1, bypass the LLM and return hits:
    if (modelId === 'deepseek_r1') {
      try {
        const hits = (await runTool('deepseek_r1', {
          query: lastUserText,
          numResults: 10,
        })) as SearchResult[];

        // Format as Markdown list
        const reply = hits
          .map((h, i) => `${i + 1}. [${h.title}](${h.link}): ${h.snippet}`)
          .join('\n\n') || 'No results found.';

        return res.status(200).json({ reply });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown DeepSeek error';
        console.error('[DeepSeek R1] Error:', msg);
        return res.status(500).json({ error: `DeepSeek R1 failed: ${msg}` });
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    // Otherwise, fall through to your existing Groq flow:

    // 1) System prompts—date + Markdown instructions
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

    // 2) Detect fresh or complex query
    const lower = lastUserText.toLowerCase();
    const isFresh = /\b(today|latest|breaking|news|this week)\b/.test(lower);
    const shouldDeepSeek = lower.length > 50;

    // 3) Build enriched prompt
    const enriched: Message[] = [dateMsg, markdownMsg];

    if (isFresh) {
      try {
        const web = (await runTool('search_web', {
          query: lower,
          onlyRecent: true,
          numResults: 5,
        })) as SearchResult[];

        const list = web.map((w, i) => `${i + 1}. **${w.title}**: ${w.snippet}`).join('\n');
        enriched.push({ role: 'system', content: `## Recent Web Results\n${list}` });
      } catch (webErr: unknown) {
        console.warn('[search_web] failed:', webErr);
      }
    }

    if (shouldDeepSeek) {
      try {
        const deep = (await runTool('deepseek_r1', {
          query: lower,
          numResults: 5,
        })) as SearchResult[];

        const list = deep.map((d, i) => `${i + 1}. **${d.title}**: ${d.snippet}`).join('\n');
        enriched.push({ role: 'system', content: `## DeepSeek Insights\n${list}` });
      } catch (dsErr: unknown) {
        console.warn('[deepseek_r1] failed:', dsErr);
      }
    }

    // Append the user & assistant history
    enriched.push(...messages);

    // 4) Call Groq
    const { data } = await axios.post<ChatResponse>(
      GROQ_ENDPOINT,
      { model: modelId, messages: enriched },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) throw new Error('No reply from Groq API');
    return res.status(200).json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[api/ask] Error:', msg);
    return res.status(500).json({ error: `Server error: ${msg}` });
  }
}
