/**
 * Async task management — for long-running ingestion or indexing operations.
 */
import { ovGet, ovDelete } from './client.mjs';

export const taskTools = [
  {
    name: 'nordic_get_task',
    description: 'Get the status and result of an async task.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'nordic_list_tasks',
    description: 'List recent async tasks with their statuses.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'], description: 'Filter by status' },
        limit: { type: 'integer', default: 20 },
      },
      required: [],
    },
  },
  {
    name: 'nordic_cancel_task',
    description: 'Cancel a pending or running async task.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
      },
      required: ['task_id'],
    },
  },
];

export async function handleTasks(name, args) {
  if (name === 'nordic_get_task') {
    return ovGet(`/api/v1/tasks/${args.task_id}`);
  }
  if (name === 'nordic_list_tasks') {
    return ovGet('/api/v1/tasks', { status: args.status, limit: args.limit ?? 20 });
  }
  if (name === 'nordic_cancel_task') {
    return ovDelete(`/api/v1/tasks/${args.task_id}`);
  }
}
