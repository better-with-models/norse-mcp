import { z } from 'zod';
import { buildTenantHeaders } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  // ── ov_tasks_get ─────────────────────────────────────────────────────────────
  server.tool(
    'ov_tasks_get',
    'Get the status/result of an OpenViking async task by task ID.',
    {
      task_id:    z.string().describe('Task ID returned by async operations'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ task_id, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/tasks/${encodeURIComponent(task_id)}`, {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_tasks_list ────────────────────────────────────────────────────────────
  server.tool(
    'ov_tasks_list',
    'List OpenViking async tasks, optionally filtered by type, status, or resource.',
    {
      task_type:   z.string().optional().describe('Filter by task type'),
      status:      z.string().optional().describe('Filter by status (e.g. pending, complete, error)'),
      resource_id: z.string().optional().describe('Filter by associated resource ID'),
      limit:       z.number().int().min(1).optional().describe('Max results to return'),
      account_id:  z.string().optional(),
      user_id:     z.string().optional(),
    },
    async ({ task_type, status, resource_id, limit, account_id, user_id }) => {
      const params = new URLSearchParams();
      if (task_type   != null) params.set('task_type',   task_type);
      if (status      != null) params.set('status',      status);
      if (resource_id != null) params.set('resource_id', resource_id);
      if (limit       != null) params.set('limit',       String(limit));
      const qs = params.toString();
      const r = await client.fetch(
        `/api/v1/tasks${qs ? `?${qs}` : ''}`, {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );
}
