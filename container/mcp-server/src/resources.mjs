import { ovGet, ovPost, ovDelete } from './client.mjs';
import { z } from 'zod';

export const resourceTools = [
  {
    name: 'nordic_list_collections',
    description: 'List all collections in the vector database.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'nordic_create_collection',
    description: 'Create a new named collection.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Collection name (unique identifier)' },
        description: { type: 'string', description: 'Human-readable description' },
      },
      required: ['name'],
    },
  },
  {
    name: 'nordic_get_collection',
    description: 'Get metadata and stats for a specific collection.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
      },
      required: ['collection'],
    },
  },
  {
    name: 'nordic_delete_collection',
    description: 'Delete a collection and all its data permanently.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name to delete' },
      },
      required: ['collection'],
    },
  },
];

export async function handleResources(name, args) {
  if (name === 'nordic_list_collections') return ovGet('/api/v1/collections');
  if (name === 'nordic_create_collection') return ovPost('/api/v1/collections', args);
  if (name === 'nordic_get_collection') return ovGet(`/api/v1/collections/${args.collection}`);
  if (name === 'nordic_delete_collection') return ovDelete(`/api/v1/collections/${args.collection}`);
}
