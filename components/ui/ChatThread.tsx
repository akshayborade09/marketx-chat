// components/ui/ChatThread.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ModelSelector from './ModelSelector';
import { useModels } from '../../lib/useModels';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatThreadProps {
  model: string;
  onModelChange: (model: string) => void;
}

export default function ChatThread({ model, onModelChange }: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('New Conversation');

  // Fetch model list
  const { models, loading: loadingModels } = useModels();

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // New chat
  const handleNewChat = () => {
    setMessages([]);
    setTitle('New Conversation');
  };

  // Send message
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText || 'Unknown error');
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `**Error:** ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-2 border-b">
        <button
          onClick={handleNewChat}
          className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="inline-block w-5 text-center font-bold">+</span>
          <span className="text-sm font-medium">New Chat</span>
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 mx-4 px-2 py-1 border rounded-md text-center
                     focus:outline-none focus:ring-2 focus:ring-blue-400
                     hover:border-gray-400 transition-colors"
        />
        <div className="w-48">
          {loadingModels ? (
            <span className="text-sm text-gray-500">Loading…</span>
          ) : (
            <ModelSelector
              models={models}
              value={model}
              onChange={onModelChange}
              className="w-full"
            />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-3 py-2 rounded-lg ${
              m.role === 'user'
                ? 'bg-blue-100 ml-auto text-right'
                : 'bg-white mr-auto text-left border'
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {m.content}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white px-4 py-3 border-t">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 focus:outline-none"
            placeholder={loading ? 'Thinking…' : 'Type a message…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
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
