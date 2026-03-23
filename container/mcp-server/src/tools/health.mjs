import { buildTenantHeaders } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  // ── ov_health_get ────────────────────────────────────────────────────────────
  server.tool(
    'ov_health_get',
    'Check OpenViking health (no authentication required).',
    {},
    async () => {
      const r = await client.fetch('/health', {}, buildTenantHeaders({}));
      return text(r);
    }
  );

  // ── ov_ready_get ─────────────────────────────────────────────────────────────
  server.tool(
    'ov_ready_get',
    'Check OpenViking readiness — confirms all subsystems are initialised.',
    {},
    async () => {
      const r = await client.fetch('/ready', {}, buildTenantHeaders({}));
      return text(r);
    }
  );
}
