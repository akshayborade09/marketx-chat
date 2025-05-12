import type { NextApiRequest, NextApiResponse } from 'next';

export type ModelOption = { label: string; value: string };

export default function handler(
  _: NextApiRequest,
  res: NextApiResponse<ModelOption[]>
) {
  const models: ModelOption[] = [
    { label: 'Meta-Llama-3.1-8B-Instruct-Turbo', value: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo' },
    { label: 'Meta-Llama-3-70B-Instruct-Turbo', value: 'meta-llama/Meta-Llama-3-70B-Instruct-Turbo' },
    { label: 'Qwen QwQ-32B', value: 'Qwen/QwQ-32B' },
    { label: 'Google Gemma-2-9B-IT', value: 'google/gemma-2-9b-it' },
    { label: 'Mistral-Small-24B-Instruct-2501', value: 'mistralai/Mistral-Small-24B-Instruct-2501' },
  ];
  res.status(200).json(models);
}