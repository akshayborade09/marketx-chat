'use client';
import { useState } from 'react';
import ChatThread from '../components/ui/ChatThread';
import ModelSelector from '../components/ui/ModelSelector';

export default function Playground() {
  const [model, setModel] = useState('');
  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🧠 Model Playground</h1>
        <ModelSelector onChange={setModel} />
      </header>
      {model ? <ChatThread model={model} /> : <p className="text-gray-500">Select a model to start the agent.</p>}
    </div>
  );
}
