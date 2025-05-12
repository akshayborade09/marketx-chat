// pages/api/ask.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { runTool, SearchResult } from '../../lib/tool-executor';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ reply?: string; error?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1️⃣ Pull in messages, model, and client timezone
  const { messages, model, timezone } = req.body as {
    messages: Message[];
    model?: string;
    timezone?: string;
  };

  // 2️⃣ Validate inputs
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing messages' });
  }
  if (!process.env.TOGETHER_API_KEY) {
    return res.status(500).json({ error: 'Missing TOGETHER_API_KEY' });
  }

  // 3️⃣ Build the “current date” system message in user’s timezone
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

  // 4️⃣ Enforce Markdown formatting from the model
  const markdownSystemMsg: Message = {
    role: 'system',
    content: [
      'Please respond **in Markdown** only.',
      '- Use `##` for section headings.',
      '- Use ordered lists (`1.`, `2.`) for step sequences.',
      '- Use bullet lists (`-`) for groups of items.',
      '- Bold (`**like this**`) and italicize (`*like this*`) for emphasis.',
      '',
      'Example output:',
      '```md',
      '## Latest News on <topic>',
      '1. **Headline**: summary…',
      '- **Key Point**: detail…',
      '```',
    ].join('\n'),
  };

  // 5️⃣ Detect time-sensitive queries
  const lastContent = messages[messages.length - 1].content.toLowerCase();
  const isRecentQuery = /\b(latest|today|news|breaking|this week|this month)\b/.test(
    lastContent
  );

  // 6️⃣ Optionally prepend fresh search snippets (last 24h)
  let augmented: Message[] = [dateSystemMsg, markdownSystemMsg, ...messages];
  if (isRecentQuery) {
    try {
      const results = (await runTool('search_web', {
        query: lastContent,
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
          content: `## Fresh Search Results (last 24h)\n${snippetList}`,
        },
        ...messages,
      ];
    } catch (err) {
      console.error('[Search Error]', err);
      // proceed without snippets if search fails
    }
  }

  // 7️⃣ Choose the model
  const defaultModel = process.env.DEFAULT_MODEL!;
  const modelId = model || defaultModel;

  // 8️⃣ Call Together.ai
  try {
    const { data } = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: modelId,
        messages: augmented,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ reply });
  } catch (err: any) {
    console.error('[Together API Error]', err);
    return res
      .status(500)
      .json({ error: err.response?.data?.error || err.message });
  }
}
