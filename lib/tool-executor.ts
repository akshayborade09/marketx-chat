// lib/tool-executor.ts
import axios from 'axios';

export type SearchResult = {
  title: string;
  link: string;
  snippet: string;
};

/**
 * Generic tool runner.
 */
export async function runTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'search_web':
      // args should be { query: string; onlyRecent?: boolean; numResults?: number }
      return runSearchWeb(args);
    // add other tools here…
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Performs a Google Custom Search.
 *
 * @param query     The search query.
 * @param onlyRecent  If true, restricts to the last 24 hours and sorts by date.
 * @param numResults  Number of results to return (default 5).
 */
export async function runSearchWeb({
  query,
  onlyRecent = false,
  numResults = 5,
}: {
  query: string;
  onlyRecent?: boolean;
  numResults?: number;
}): Promise<SearchResult[]> {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) {
    throw new Error('Missing GOOGLE_API_KEY or GOOGLE_CSE_ID in .env.local');
  }

  const params: Record<string, any> = {
    key,
    cx,
    q: query,
    num: numResults,
  };

  if (onlyRecent) {
    params.sort = 'date';         // sort by newest
    params.dateRestrict = 'd1';   // last 1 day
  }

  const resp = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params,
  });

  const items = Array.isArray(resp.data.items) ? resp.data.items : [];
  return items.map((item: any) => ({
    title: item.title as string,
    link: item.link as string,
    snippet: item.snippet as string,
  }));
}
