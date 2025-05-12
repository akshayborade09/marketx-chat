// components/ui/ChatThread.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatThread({ model }: { model: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Add user message
    const userMsg: ChatMessage = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, model, timezone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `**Error:** ${e.message}`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Chat history */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg p-3 ${
              m.role === 'user'
                ? 'bg-blue-100 self-end text-right'
                : 'bg-gray-100 self-start text-left'
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {m.content}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border rounded px-3 py-2 focus:outline-none"
            placeholder={loading ? 'Thinking…' : 'Type a message…'}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
