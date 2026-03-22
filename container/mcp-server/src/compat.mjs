/**
 * Legacy compatibility aliases.
 * Provides short-name aliases for the most commonly used tools so that
 * prompts written against the original OpenViking API continue to work.
 */
import { handleSearch } from './search.mjs';
import { handleSkills } from './skills.mjs';
import { handleResources } from './resources.mjs';

export const compatTools = [
  {
    name: 'search_by_text',
    description: '[Alias] Semantic search — equivalent to nordic_search.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        query: { type: 'string' },
        top_k: { type: 'integer', default: 5 },
      },
      required: ['collection', 'query'],
    },
  },
  {
    name: 'upsert_data',
    description: '[Alias] Upsert items — equivalent to nordic_upsert_item.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        items: { type: 'array', items: { type: 'object' } },
      },
      required: ['collection', 'items'],
    },
  },
  {
    name: 'fetch_data',
    description: '[Alias] Fetch item — equivalent to nordic_fetch_item.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        id: { type: 'string' },
      },
      required: ['collection', 'id'],
    },
  },
  {
    name: 'list_collection',
    description: '[Alias] List collections — equivalent to nordic_list_collections.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'delete_data',
    description: '[Alias] Delete item — equivalent to nordic_delete_item.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        id: { type: 'string' },
      },
      required: ['collection', 'id'],
    },
  },
];

export async function handleCompat(name, args) {
  if (name === 'search_by_text') return handleSearch('nordic_search', args);
  if (name === 'upsert_data') return handleSkills('nordic_upsert_item', args);
  if (name === 'fetch_data') return handleSkills('nordic_fetch_item', args);
  if (name === 'list_collection') return handleResources('nordic_list_collections', args);
  if (name === 'delete_data') return handleSkills('nordic_delete_item', args);
}
