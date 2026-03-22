/**
 * Relation graph operations — link items within or across collections.
 */
import { ovGet, ovPost, ovDelete } from './client.mjs';

export const relationTools = [
  {
    name: 'nordic_add_relation',
    description: 'Create a typed relation between two items.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        source_id: { type: 'string' },
        target_id: { type: 'string' },
        relation_type: { type: 'string', description: 'e.g. "references", "derived_from", "related"' },
        metadata: { type: 'object' },
      },
      required: ['collection', 'source_id', 'target_id', 'relation_type'],
    },
  },
  {
    name: 'nordic_get_relations',
    description: 'Get all relations for an item (in and out edges).',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        item_id: { type: 'string' },
        direction: { type: 'string', enum: ['in', 'out', 'both'], default: 'both' },
      },
      required: ['collection', 'item_id'],
    },
  },
  {
    name: 'nordic_delete_relation',
    description: 'Remove a specific relation between two items.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        relation_id: { type: 'string' },
      },
      required: ['collection', 'relation_id'],
    },
  },
];

export async function handleRelations(name, args) {
  if (name === 'nordic_add_relation') {
    return ovPost(`/api/v1/collections/${args.collection}/relations`, {
      source_id: args.source_id,
      target_id: args.target_id,
      relation_type: args.relation_type,
      metadata: args.metadata,
    });
  }
  if (name === 'nordic_get_relations') {
    return ovGet(`/api/v1/collections/${args.collection}/items/${args.item_id}/relations`, {
      direction: args.direction ?? 'both',
    });
  }
  if (name === 'nordic_delete_relation') {
    return ovDelete(`/api/v1/collections/${args.collection}/relations/${args.relation_id}`);
  }
}
