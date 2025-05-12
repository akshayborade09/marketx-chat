// pages/api/models.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export type ModelOption = { label: string; value: string };

export default function handler(
  _: NextApiRequest,
  res: NextApiResponse<ModelOption[]>
) {
  const models: ModelOption[] = [
      { label: 'LLaMA 3 8B', value: 'llama3-8b-8192' },
      { label: 'LLaMA 3 70B', value: 'llama3-70b-8192' },
      { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
      { label: 'Gemma 7B IT', value: 'gemma-7b-it' },
    ];

  res.status(200).json(models);
}
