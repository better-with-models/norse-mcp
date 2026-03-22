/**
 * Admin tools — API key management, backup, restore.
 */
import { ovGet, ovPost, ovDelete } from './client.mjs';

export const adminTools = [
  {
    name: 'nordic_create_api_key',
    description: 'Create a scoped API key with optional collection access restrictions.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Human-readable label for the key' },
        collections: {
          type: 'array',
          items: { type: 'string' },
          description: 'Collections this key can access. Omit to allow all.',
        },
        read_only: { type: 'boolean', default: false },
      },
      required: ['name'],
    },
  },
  {
    name: 'nordic_list_api_keys',
    description: 'List all API keys (without revealing key values).',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'nordic_revoke_api_key',
    description: 'Revoke an API key by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        key_id: { type: 'string' },
      },
      required: ['key_id'],
    },
  },
  {
    name: 'nordic_trigger_backup',
    description: 'Trigger a point-in-time backup of all collections.',
    inputSchema: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Optional backup label' },
      },
      required: [],
    },
  },
];

export async function handleAdmin(name, args) {
  if (name === 'nordic_create_api_key') {
    return ovPost('/api/v1/admin/keys', {
      name: args.name,
      collections: args.collections,
      read_only: args.read_only ?? false,
    });
  }
  if (name === 'nordic_list_api_keys') return ovGet('/api/v1/admin/keys');
  if (name === 'nordic_revoke_api_key') return ovDelete(`/api/v1/admin/keys/${args.key_id}`);
  if (name === 'nordic_trigger_backup') return ovPost('/api/v1/admin/backup', { label: args.label });
}
