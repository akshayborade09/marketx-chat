// pages/api/ask.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { runTool, SearchResult } from '../../lib/tool-executor';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ApiResponse = {
  reply?: string;
  error?: string;
  stack?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, model, timezone } = req.body as {
      messages?: Message[];
      model?: string;
      timezone?: string;
    };

    // validate inputs
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Missing or invalid messages');
    }
    const TOG_KEY = process.env.TOGETHER_API_KEY;
    const DEF_MODEL = process.env.DEFAULT_MODEL;
    if (!TOG_KEY) throw new Error('Missing TOGETHER_API_KEY');
    if (!DEF_MODEL) throw new Error('Missing DEFAULT_MODEL');

    // build system prompts (date + markdown)
    const tz = typeof timezone === 'string' ? timezone : 'UTC';
    let todayDate: string;
    try {
      todayDate = new Date().toLocaleDateString('en-GB', {
        timeZone: tz,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      todayDate = new Date().toLocaleDateString('en-GB', {
        timeZone: 'UTC',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    const dateSystemMsg: Message = {
      role: 'system',
      content: `Current date (${tz}): **${todayDate}**.`,
    };
    const markdownSystemMsg: Message = {
      role: 'system',
      content: [
        'Please respond **in Markdown** only.',
        '- Use `##` for headings.',
        '- Use ordered lists (`1.`) for sequences.',
        '- Use bullets (`-`) for item lists.',
        '',
        '```md',
        '## Example Heading',
        '1. **Point**: detail',
        '- **Note**: info',
        '```',
      ].join('\n'),
    };

    // detect freshness
    const last = messages[messages.length - 1].content.toLowerCase();
    const isRecent =
      /\b(latest|today|news|breaking|this week|this month)\b/.test(last);

    // build augmented array
    let augmented: Message[] = [dateSystemMsg, markdownSystemMsg, ...messages];
    if (isRecent) {
      try {
        const results = (await runTool('search_web', {
          query: last,
          onlyRecent: true,
          numResults: 5,
        })) as SearchResult[];
        const snippetList = results
          .map((r, i) => `${i + 1}. **${r.title}**: ${r.snippet}`)
          .join('\n');
        augmented = [
          dateSystemMsg,
          markdownSystemMsg,
          {
            role: 'system',
            content: `## Fresh Search Results (24h)\n${snippetList}`,
          },
          ...messages,
        ];
      } catch (e) {
        console.warn('[Search Error]', e);
      }
    }

    // call Together.ai
    const modelId = model || DEF_MODEL;
    const { data } = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      { model: modelId, messages: augmented },
      { headers: { Authorization: `Bearer ${TOG_KEY}` } }
    );

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) throw new Error('No reply returned from LLM');
    return res.status(200).json({ reply });
  } catch (err: any) {
    console.error('[api/ask] Error:', err);
    // DEV-only: include stack trace
    if (process.env.NODE_ENV !== 'production') {
      return res
        .status(500)
        .json({ error: err.message, stack: err.stack });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
