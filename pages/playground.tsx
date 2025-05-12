// pages/playground.tsx
'use client';

import { useState, useEffect } from 'react';
import { useModels } from '../lib/useModels';
import ChatThread from '../components/ui/ChatThread';

export default function Playground() {
  const { models, loading } = useModels();
  const [model, setModel] = useState('');

  // Auto‐select first model once loaded
  useEffect(() => {
    if (!model && models.length) {
      setModel(models[0].value);
    }
  }, [models, model]);

  // Show loading until models fetched
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading models…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {model ? (
        // Only ChatThread is rendered here, with the correct props
        <ChatThread model={model} onModelChange={setModel} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">
            No models available. Please check your configuration.
          </p>
        </div>
      )}
    </div>
  );
}
