'use client';
import { useEffect, useState } from 'react';
import { useModels } from '../../lib/useModels';

type Props = { onChange: (model: string) => void };

export default function ModelSelector({ onChange }: Props) {
  const { models, loading } = useModels();
  const [model, setModel] = useState('');
  useEffect(() => {
    if (!model && models.length) { setModel(models[0].value); onChange(models[0].value); }
  }, [models, model, onChange]);
  if (loading) return <span>Loading models…</span>;
  return (
    <select
      value={model}
      onChange={(e) => { setModel(e.target.value); onChange(e.target.value); }}
      className="border rounded px-2 py-1 text-sm"
    >
      {models.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
    </select>
  );
}