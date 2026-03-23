import { z } from 'zod';
import { buildTenantHeaders } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  const gets = [
    ['ov_observer_queue_get',    '/api/v1/observer/queue',    'Get the OpenViking observer processing queue status.'],
    ['ov_observer_vikingdb_get', '/api/v1/observer/vikingdb', 'Get the OpenViking VikingDB observer metrics.'],
    ['ov_observer_vlm_get',      '/api/v1/observer/vlm',      'Get the OpenViking VLM observer metrics.'],
    ['ov_observer_system_get',   '/api/v1/observer/system',   'Get the OpenViking system observer metrics.'],
    ['ov_debug_health_get',      '/api/v1/debug/health',      'Get the OpenViking debug health report.'],
  ];

  for (const [name, path, description] of gets) {
    server.tool(
      name,
      description,
      {
        account_id: z.string().optional(),
        user_id:    z.string().optional(),
      },
      async ({ account_id, user_id }) => {
        const r = await client.fetch(
          path, {},
          buildTenantHeaders({ account_id, user_id })
        );
        return text(r);
      }
    );
  }
}
