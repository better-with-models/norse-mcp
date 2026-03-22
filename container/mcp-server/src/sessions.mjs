/**
 * Session management — scoped interaction contexts.
 */
import { ovGet, ovPost, ovDelete } from './client.mjs';

export const sessionTools = [
  {
    name: 'nordic_create_session',
    description: 'Create a new session context for multi-turn interactions.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Optional custom ID; server generates one if omitted' },
        metadata: { type: 'object' },
      },
      required: [],
    },
  },
  {
    name: 'nordic_get_session',
    description: 'Get session state and history.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'nordic_list_sessions',
    description: 'List all active sessions.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'nordic_delete_session',
    description: 'End and delete a session.',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string' },
      },
      required: ['session_id'],
    },
  },
];

export async function handleSessions(name, args) {
  if (name === 'nordic_create_session') {
    return ovPost('/api/v1/sessions', { session_id: args.session_id, metadata: args.metadata });
  }
  if (name === 'nordic_get_session') {
    return ovGet(`/api/v1/sessions/${args.session_id}`);
  }
  if (name === 'nordic_list_sessions') {
    return ovGet('/api/v1/sessions');
  }
  if (name === 'nordic_delete_session') {
    return ovDelete(`/api/v1/sessions/${args.session_id}`);
  }
}
