// components/ChatForm.tsx
'use client'; // if you're using Next.js App Router

import { useState } from 'react';

export default function ChatForm() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');

  const sendMessage = async () => {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: input },
        ],
      }),
    });

    const data = await res.json();
    setReply(data.reply || 'Error getting reply');
  };

  return (
    <div className="p-4">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Ask something..."
        className="border p-2 w-full"
      />
      <button
        onClick={sendMessage}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Send
      </button>
      {reply && <p className="mt-4">🧠 {reply}</p>}
    </div>
  );
}
