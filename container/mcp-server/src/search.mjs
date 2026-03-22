/**
 * Vector and hybrid search operations.
 */
import { ovPost } from './client.mjs';

export const searchTools = [
  {
    name: 'nordic_search',
    description: 'Semantic vector search over a collection. Returns ranked results with scores.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        query: { type: 'string', description: 'Natural-language query text' },
        top_k: { type: 'integer', default: 5, description: 'Number of results to return' },
        filter: { type: 'object', description: 'Optional metadata filter' },
      },
      required: ['collection', 'query'],
    },
  },
  {
    name: 'nordic_hybrid_search',
    description: 'Combined vector + keyword search with configurable alpha weighting.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        query: { type: 'string' },
        top_k: { type: 'integer', default: 5 },
        alpha: { type: 'number', default: 0.7, description: 'Weight for vector vs keyword (0=keyword only, 1=vector only)' },
        filter: { type: 'object' },
      },
      required: ['collection', 'query'],
    },
  },
  {
    name: 'nordic_multi_collection_search',
    description: 'Search across multiple collections simultaneously.',
    inputSchema: {
      type: 'object',
      properties: {
        collections: { type: 'array', items: { type: 'string' } },
        query: { type: 'string' },
        top_k: { type: 'integer', default: 5 },
      },
      required: ['collections', 'query'],
    },
  },
];

export async function handleSearch(name, args) {
  if (name === 'nordic_search') {
    return ovPost(`/api/v1/collections/${args.collection}/search`, {
      query: args.query,
      top_k: args.top_k ?? 5,
      filter: args.filter,
    });
  }
  if (name === 'nordic_hybrid_search') {
    return ovPost(`/api/v1/collections/${args.collection}/search/hybrid`, {
      query: args.query,
      top_k: args.top_k ?? 5,
      alpha: args.alpha ?? 0.7,
      filter: args.filter,
    });
  }
  if (name === 'nordic_multi_collection_search') {
    return ovPost('/api/v1/search/multi', {
      collections: args.collections,
      query: args.query,
      top_k: args.top_k ?? 5,
    });
  }
}
