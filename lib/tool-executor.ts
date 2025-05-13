// lib/tool-executor.ts
import axios, { AxiosError } from 'axios';

export type SearchResult = {
  title: string;
  link: string;
  snippet: string;
};

export default async function runTool(
  tool: 'search_web' | 'deepseek_r1',
  params: {
    query: string;
    onlyRecent?: boolean;
    numResults?: number;
    pageSize?: number;
  }
): Promise<SearchResult[]> {
  if (tool === 'search_web') {
    const { query, onlyRecent = false, numResults = 5 } = params;
    const KEY = process.env.BING_SEARCH_KEY!;
    const ENDPOINT = process.env.BING_SEARCH_ENDPOINT!;
    const searchParams: any = {
      q: query,
      count: numResults,
      mkt: 'en-US',
      safeSearch: 'Off',
    };
    if (onlyRecent) searchParams.freshness = 'Day';

    const { data } = await axios.get<{ value: Array<{ name: string; url: string; description: string }> }>(
      ENDPOINT,
      {
        headers: { 'Ocp-Apim-Subscription-Key': KEY },
        params: searchParams,
      }
    );

    return (data.value || []).map((item) => ({
      title: item.name,
      link: item.url,
      snippet: item.description,
    }));
  }

  // lib/tool-executor.ts (DeepSeek branch)
if (tool === 'deepseek_r1') {
  const { query } = params;
  const size = params.numResults ?? params.pageSize ?? 5;
  const API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!API_KEY) throw new Error('Missing DEEPSEEK_API_KEY');

  try {
    // corrected endpoint & payload
    const { data } = await axios.post<{ hits: any[] }>(
      'https://api.deepseek.ai/v1beta/search',
      { q: query, size },
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );

    return (data.hits || []).map((h) => ({
      title: h.title,
      link: h.url,
      snippet: h.snippet,
    }));
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      console.warn('[deepseek_r1] 404 Not Found – returning empty results');
      return [];
    }
    throw err;
  }
}


  throw new Error(`Unknown tool: ${tool}`);
}
