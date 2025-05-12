// components/ui/ChatThread.tsx
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string; // now supports Markdown
}

export default function ChatThread({ model }: { model: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput('');

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updated, model, timezone }),
    });
    const data = await res.json();

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: data.reply ?? `**Error:** ${data.error ?? 'Unknown error'}`,
    };
    setMessages((prev) => [...updated, assistantMessage]);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Messages panel */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-20 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`prose max-w-none break-words p-3 rounded-lg ${
              m.role === 'user'
                ? 'self-end bg-blue-100 text-right'
                : 'self-start bg-gray-100 text-left'
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {m.content}
            </ReactMarkdown>
          </div>
        ))}
      </div>

      {/* Input bar - fixed at bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t px-4 py-3">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 border rounded px-3 py-2 focus:outline-none"
            placeholder="Type a message…"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
