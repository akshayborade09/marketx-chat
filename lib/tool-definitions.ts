export const tools = [
  {
    name: 'search_web',
    description: 'Run a web search and return top results',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'vector_retrieval',
    description: 'Retrieve relevant documents from vector store',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Query to find related docs' },
        topK: { type: 'number', description: 'Number of docs to return' },
      },
      required: ['query', 'topK'],
    },
  },
];
