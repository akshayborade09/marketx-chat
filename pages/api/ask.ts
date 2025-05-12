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

  // 1️⃣ Destructure timezone along with messages and model
  const { messages, model, timezone } = req.body as {
    messages: Message[];
    model?: string;
    timezone?: string;
  };

  // 2️⃣ Basic validation
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing messages' });
  }
  if (!process.env.TOGETHER_API_KEY) {
    return res.status(500).json({ error: 'Missing TOGETHER_API_KEY' });
  }

  // 3️⃣ Compute “current date” using the client’s timezone (or UTC fallback)
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
    // if the passed timezone is invalid, fallback safely
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
    content: `Current date (${tz}): ${todayDate}. Use this for any “today” references.`,
  };

  // 4️⃣ Detect time-sensitive queries
  const lastContent = messages[messages.length - 1].content.toLowerCase();
  const isRecentQuery = /\b(latest|today|news|breaking|this week|this month)\b/.test(
    lastContent
  );

  // 5️⃣ Optionally prepend fresh search snippets
  let augmented: Message[] = [dateSystemMsg, ...messages];
  if (isRecentQuery) {
    try {
      const results = (await runTool('search_web', {
        query: lastContent,
        onlyRecent: true,
        numResults: 5,
      })) as SearchResult[];

      const snippets = results.map(r => `• ${r.title} — ${r.snippet}`).join('\n');
      augmented = [
        dateSystemMsg,
        {
          role: 'system',
          content: `Here are the latest search results (last 24 h):\n${snippets}`,
        },
        ...messages,
      ];
    } catch (err) {
      console.error('[Search Error]', err);
      // continue without snippets
    }
  }

  // 6️⃣ Determine model
  const defaultModel = process.env.DEFAULT_MODEL!;
  const modelId = model || defaultModel;

  // 7️⃣ Call Together.ai
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
