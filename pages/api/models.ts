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
      { label: 'DeepSeek R1', value: 'deepseek_r1'},   
    ];

  res.status(200).json(models);
}
