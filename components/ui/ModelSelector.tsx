// components/ui/ModelSelector.tsx
'use client';

import { FC } from 'react';

export interface ModelOption {
  label: string;
  value: string;
}

interface ModelSelectorProps {
  models: ModelOption[];
  value: string;
  onChange: (model: string) => void;
  className?: string;
}

const ModelSelector: FC<ModelSelectorProps> = ({
  models,
  value,
  onChange,
  className,
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`block w-full border rounded-md px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-400
                hover:border-gray-400 transition-colors
                ${className || ''}`}
  >
    {models.map((m) => (
      <option key={m.value} value={m.value}>
        {m.label}
      </option>
    ))}
  </select>
);

export default ModelSelector;
