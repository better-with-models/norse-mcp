import { z } from 'zod';
import { buildTenantHeaders } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  // ── ov_system_status_get ─────────────────────────────────────────────────────
  server.tool(
    'ov_system_status_get',
    'Get the current OpenViking system status.',
    {
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ account_id, user_id }) => {
      const r = await client.fetch(
        '/api/v1/system/status', {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_system_wait ───────────────────────────────────────────────────────────
  server.tool(
    'ov_system_wait',
    'Wait for the OpenViking system to reach a ready state.',
    {
      timeout:    z.number().optional().describe('Timeout seconds'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ timeout, account_id, user_id }) => {
      const body = {
        ...(timeout != null && { timeout }),
      };
      const r = await client.fetch(
        '/api/v1/system/wait',
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );
}
