// lib/tool-executor.ts
import axios from 'axios';

export type SearchResult = { title: string; link: string; snippet: string };

// Broaden the `tool` parameter from a literal union to any string:
export async function runTool(
  tool: string,
  params: { query?: string; onlyRecent?: boolean; numResults?: number; pageSize?: number }
): Promise<any> {
  switch (tool) {
    case 'search_web': {
      const { query = '', onlyRecent = false, numResults = 5 } = params;
      // … your existing web-search code …
      const KEY = process.env.BING_SEARCH_KEY!;
      const ENDPOINT = process.env.BING_SEARCH_ENDPOINT!;
      const searchParams: any = { q: query, count: numResults, mkt: 'en-US', safeSearch: 'Off' };
      if (onlyRecent) searchParams.freshness = 'Day';

      const { data } = await axios.get(ENDPOINT, {
        headers: { 'Ocp-Apim-Subscription-Key': KEY },
        params: searchParams,
      });
      return (data.value || []).map((item: any) => ({
        title: item.name,
        link: item.url,
        snippet: item.description,
      }));
    }

    case 'deepseek_r1': {
      const { query = '', pageSize = 5 } = params;
      const API_KEY = process.env.DEEPSEEK_API_KEY;
      if (!API_KEY) throw new Error('Missing DEEPSEEK_API_KEY');

      const { data } = await axios.post(
        'https://api.deepseek.com/v1/search',
        { query, pageSize },
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );
      return (data.hits || []).map((h: any) => ({
        title: h.title,
        link: h.url,
        snippet: h.snippet,
      }));
    }

    // Add additional tools here…

    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}
