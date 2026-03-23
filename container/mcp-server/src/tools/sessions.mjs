import { z } from 'zod';
import { buildTenantHeaders } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  // ── ov_sessions_create ───────────────────────────────────────────────────────
  server.tool(
    'ov_sessions_create',
    'Create a new OpenViking session.',
    {
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ account_id, user_id }) => {
      const r = await client.fetch(
        '/api/v1/sessions',
        { method: 'POST', body: JSON.stringify({}) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_sessions_list ─────────────────────────────────────────────────────────
  server.tool(
    'ov_sessions_list',
    'List all OpenViking sessions.',
    {
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ account_id, user_id }) => {
      const r = await client.fetch(
        '/api/v1/sessions', {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_sessions_get ──────────────────────────────────────────────────────────
  server.tool(
    'ov_sessions_get',
    'Get a specific OpenViking session by ID.',
    {
      id:         z.string().describe('Session ID'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ id, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/sessions/${encodeURIComponent(id)}`, {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_sessions_delete ───────────────────────────────────────────────────────
  server.tool(
    'ov_sessions_delete',
    'Delete an OpenViking session.',
    {
      id:         z.string().describe('Session ID'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ id, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/sessions/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_sessions_add_message ──────────────────────────────────────────────────
  server.tool(
    'ov_sessions_add_message',
    'Add a message to an OpenViking session.',
    {
      id:      z.string().describe('Session ID'),
      role:    z.enum(['user', 'assistant', 'system']).describe('Message role'),
      content: z.string().optional().describe('Plain text message content'),
      parts:   z.array(z.record(z.unknown())).optional().describe('Structured message parts'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ id, role, content, parts, account_id, user_id }) => {
      const body = {
        role,
        ...(content != null && { content }),
        ...(parts   != null && { parts }),
      };
      const r = await client.fetch(
        `/api/v1/sessions/${encodeURIComponent(id)}/messages`,
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_sessions_mark_used ────────────────────────────────────────────────────
  server.tool(
    'ov_sessions_mark_used',
    'Mark resources as used within an OpenViking session.',
    {
      id:       z.string().describe('Session ID'),
      contexts: z.array(z.string()).describe('Viking URIs of resources used'),
      skill:    z.record(z.unknown()).optional().describe('Optional skill metadata object'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ id, contexts, skill, account_id, user_id }) => {
      const body = {
        contexts,
        ...(skill != null && { skill }),
      };
      const r = await client.fetch(
        `/api/v1/sessions/${encodeURIComponent(id)}/used`,
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_sessions_commit ───────────────────────────────────────────────────────
  // Commits the session. With wait=false (default) returns a task_id; poll with ov_tasks_get.
  server.tool(
    'ov_sessions_commit',
    'Commit an OpenViking session to persist it. ' +
    'With wait=false (default) returns a task_id — use ov_tasks_get to poll for completion.',
    {
      id:      z.string().describe('Session ID'),
      wait:    z.boolean().optional().describe('Block until commit completes (default false)'),
      timeout: z.number().optional().describe('Timeout seconds when wait=true'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ id, wait, timeout, account_id, user_id }) => {
      const body = {
        ...(wait    != null && { wait }),
        ...(timeout != null && { timeout }),
      };
      const r = await client.fetch(
        `/api/v1/sessions/${encodeURIComponent(id)}/commit`,
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );
}
