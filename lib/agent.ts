import axios from 'axios';
import { tools } from './tool-definitions';

export async function runTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'search_web': {
      const res = await axios.get(
        'https://www.googleapis.com/customsearch/v1',
        {
          params: {
            key: process.env.GOOGLE_API_KEY,
            cx: process.env.GOOGLE_CSE_ID,
            q: args.query,
            num: 5,
          },
        }
      );
      const items = res.data.items || [];
      return items.map((item: any) => ({
        title: item.title,
        snippet: item.snippet || item.snippet,
        url: item.link,
      }));
    }
    case 'vector_retrieval': {
      // TODO: integrate your vector DB here
      return [];
    }
    default:
      throw new Error(`Tool not implemented: ${name}`);
  }
}

export async function agent(
  messages: any[],
  model: string
): Promise<string> {
  const initial = await axios.post(
    'https://api.together.xyz/v1/chat/completions',
    { model, messages, functions: tools, function_call: 'auto' },
    { headers: { Authorization: `Bearer ${process.env.TOGETHER_API_KEY}` } }
  );
  const msg = initial.data.choices[0].message;

  if (msg.function_call) {
    const { name, arguments: argsStr } = msg.function_call;
    const args = JSON.parse(argsStr || '{}');
    const result = await runTool(name, args);

    const followUp = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model,
        messages: [
          ...messages,
          msg,
          { role: 'function', name, content: JSON.stringify(result) },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.TOGETHER_API_KEY}` } }
    );

    return followUp.data.choices[0].message.content;
  }

  return msg.content;
}