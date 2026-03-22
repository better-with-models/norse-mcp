/**
 * Pack operations — bulk ingest of related content bundles.
 */
import { ovGet, ovPost, ovDelete } from './client.mjs';

export const packTools = [
  {
    name: 'nordic_create_pack',
    description: 'Create a named pack (bundle) for bulk content ingestion.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        pack_id: { type: 'string', description: 'Unique pack identifier' },
        description: { type: 'string' },
      },
      required: ['collection', 'pack_id'],
    },
  },
  {
    name: 'nordic_ingest_pack',
    description: 'Add items to an existing pack in bulk.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        pack_id: { type: 'string' },
        items: {
          type: 'array',
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
      required: ['collection', 'pack_id', 'items'],
    },
  },
  {
    name: 'nordic_get_pack',
    description: 'Get pack metadata and ingestion status.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        pack_id: { type: 'string' },
      },
      required: ['collection', 'pack_id'],
    },
  },
  {
    name: 'nordic_list_packs',
    description: 'List all packs in a collection with their status and item counts.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
      },
      required: ['collection'],
    },
  },
  {
    name: 'nordic_delete_pack',
    description: 'Delete a pack and all its items.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        pack_id: { type: 'string' },
      },
      required: ['collection', 'pack_id'],
    },
  },
];

export async function handlePack(name, args) {
  const base = `/api/v1/collections/${args.collection}/packs`;
  if (name === 'nordic_create_pack') {
    return ovPost(base, { pack_id: args.pack_id, description: args.description });
  }
  if (name === 'nordic_ingest_pack') {
    return ovPost(`${base}/${args.pack_id}/items`, { items: args.items });
  }
  if (name === 'nordic_get_pack') {
    return ovGet(`${base}/${args.pack_id}`);
  }
  if (name === 'nordic_list_packs') {
    return ovGet(base);
  }
  if (name === 'nordic_delete_pack') {
    return ovDelete(`${base}/${args.pack_id}`);
  }
}
