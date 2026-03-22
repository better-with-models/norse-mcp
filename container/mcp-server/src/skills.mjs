/**
 * Item-level upsert, fetch, and delete operations within a collection.
 * ("Skills" is the OpenViking term for stored knowledge items.)
 */
import { ovGet, ovPost, ovDelete } from './client.mjs';

export const skillTools = [
  {
    name: 'nordic_upsert_item',
    description: 'Insert or update one or more items in a collection.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        items: {
          type: 'array',
          description: 'Array of items to upsert. Each item must have an id and text.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              metadata: { type: 'object' },
            },
            required: ['id', 'text'],
          },
        },
      },
      required: ['collection', 'items'],
    },
  },
  {
    name: 'nordic_fetch_item',
    description: 'Fetch a stored item by its ID.',
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
    name: 'nordic_delete_item',
    description: 'Delete a stored item by its ID.',
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
    name: 'nordic_list_items',
    description: 'List items in a collection with optional pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        limit: { type: 'integer', default: 20 },
        offset: { type: 'integer', default: 0 },
      },
      required: ['collection'],
    },
  },
];

export async function handleSkills(name, args) {
  if (name === 'nordic_upsert_item') {
    return ovPost(`/api/v1/collections/${args.collection}/items`, { items: args.items });
  }
  if (name === 'nordic_fetch_item') {
    return ovGet(`/api/v1/collections/${args.collection}/items/${args.id}`);
  }
  if (name === 'nordic_delete_item') {
    return ovDelete(`/api/v1/collections/${args.collection}/items/${args.id}`);
  }
  if (name === 'nordic_list_items') {
    return ovGet(`/api/v1/collections/${args.collection}/items`, {
      limit: args.limit ?? 20,
      offset: args.offset ?? 0,
    });
  }
}
