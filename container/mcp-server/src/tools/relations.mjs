import { z } from 'zod';
import { buildTenantHeaders, normalizeUriAlias, normalizeUriAliases } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  // ── ov_relations_get ─────────────────────────────────────────────────────────
  server.tool(
    'ov_relations_get',
    'Get all relations for an OpenViking resource URI.',
    {
      uri:        z.string().describe('OpenViking URI to fetch relations for'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ uri, account_id, user_id }) => {
      const params = new URLSearchParams({ uri: normalizeUriAlias(uri) });
      const r = await client.fetch(
        `/api/v1/relations?${params}`, {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_relations_link ────────────────────────────────────────────────────────
  server.tool(
    'ov_relations_link',
    'Create relations from one OpenViking URI to one or more target URIs.',
    {
      from_uri:   z.string().describe('Source Viking URI'),
      to_uris:    z.array(z.string()).describe('Target Viking URIs to link to'),
      reason:     z.string().optional().describe('Optional reason / label for the relation'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ from_uri, to_uris, reason, account_id, user_id }) => {
      const body = {
        from_uri: normalizeUriAlias(from_uri),
        to_uris: normalizeUriAliases(to_uris),
        ...(reason != null && { reason }),
      };
      const r = await client.fetch(
        '/api/v1/relations/link',
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_relations_unlink ──────────────────────────────────────────────────────
  server.tool(
    'ov_relations_unlink',
    'Remove relations from one OpenViking URI to one or more target URIs.',
    {
      from_uri:   z.string().describe('Source Viking URI'),
      to_uris:    z.array(z.string()).describe('Target Viking URIs to unlink'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ from_uri, to_uris, account_id, user_id }) => {
      const body = {
        from_uri: normalizeUriAlias(from_uri),
        to_uris: normalizeUriAliases(to_uris),
      };
      const r = await client.fetch(
        '/api/v1/relations/link',
        { method: 'DELETE', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );
}
