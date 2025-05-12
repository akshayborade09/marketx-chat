// lib/useModels.ts
import { useState, useEffect } from 'react';

export interface ModelOption {
  label: string;
  value: string;
}

export function useModels() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setModels(data))
      .finally(() => setLoading(false));
  }, []);

  return { models, loading };
}
