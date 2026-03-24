import { z } from 'zod';
import { buildTenantHeaders, normalizeUriAlias } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  // ── ov_pack_export ───────────────────────────────────────────────────────────
  server.tool(
    'ov_pack_export',
    'Export an OpenViking resource subtree to a pack file.',
    {
      uri:        z.string().describe('Viking URI to export'),
      to:         z.string().describe('Destination file path for the exported pack'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ uri, to, account_id, user_id }) => {
      const r = await client.fetch(
        '/api/v1/pack/export',
        { method: 'POST', body: JSON.stringify({ uri: normalizeUriAlias(uri), to }) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_pack_import ───────────────────────────────────────────────────────────
  server.tool(
    'ov_pack_import',
    'Import a pack file into the OpenViking filesystem.',
    {
      file_path:  z.string().describe('Path to the pack file to import'),
      parent:     z.string().describe('Viking URI parent directory for import'),
      force:      z.boolean().optional().describe('Overwrite existing resources'),
      vectorize:  z.boolean().optional().describe('Re-vectorize on import'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ file_path, parent, force, vectorize, account_id, user_id }) => {
      const body = {
        file_path,
        parent: normalizeUriAlias(parent),
        ...(force     != null && { force }),
        ...(vectorize != null && { vectorize }),
      };
      const r = await client.fetch(
        '/api/v1/pack/import',
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );
}
