// components/ui/ChatThread.tsx
'use client';

import { useState } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatThread({ model }: { model: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    // 1️⃣ Create a properly typed user message
    const userMessage: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    // 2️⃣ Get the browser timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 3️⃣ Send to your API
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: updatedMessages,
        model,
        timezone,
      }),
    });
    const data = await response.json();

    // 4️⃣ Append the assistant’s reply as a typed message
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: data.reply ?? `Error: ${data.error ?? 'Unknown error'}`,
    };
    setMessages([...updatedMessages, assistantMessage]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 overflow-y-auto max-h-96">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded ${
              m.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100'
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 border rounded px-2 py-1"
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
  );
}
