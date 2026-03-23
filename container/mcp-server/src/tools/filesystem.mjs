import { z } from 'zod';
import { buildTenantHeaders } from '../client.mjs';

const tenantSchema = {
  account_id: z.string().optional().describe('Account ID (root-key tenant routing)'),
  user_id:    z.string().optional().describe('User ID (root-key tenant routing)'),
};

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  // ── ov_fs_ls ────────────────────────────────────────────────────────────────
  server.tool(
    'ov_fs_ls',
    'List entries in an OpenViking filesystem directory.',
    {
      uri:       z.string().describe('OpenViking URI, e.g. ov:///path/to/dir'),
      simple:    z.boolean().optional().describe('Return simplified entry list'),
      recursive: z.boolean().optional().describe('List recursively'),
      ...tenantSchema,
    },
    async ({ uri, simple, recursive, account_id, user_id }) => {
      const params = new URLSearchParams({ uri });
      if (simple    != null) params.set('simple',    String(simple));
      if (recursive != null) params.set('recursive', String(recursive));
      const r = await client.fetch(
        `/api/v1/fs/ls?${params}`, {}, buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_fs_tree ──────────────────────────────────────────────────────────────
  server.tool(
    'ov_fs_tree',
    'Get a tree view of an OpenViking filesystem directory.',
    { uri: z.string().describe('OpenViking directory URI'), ...tenantSchema },
    async ({ uri, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/fs/tree?uri=${encodeURIComponent(uri)}`, {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_fs_stat ──────────────────────────────────────────────────────────────
  server.tool(
    'ov_fs_stat',
    'Get metadata for a single entry in the OpenViking filesystem.',
    { uri: z.string().describe('OpenViking URI'), ...tenantSchema },
    async ({ uri, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/fs/stat?uri=${encodeURIComponent(uri)}`, {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_fs_mkdir ─────────────────────────────────────────────────────────────
  server.tool(
    'ov_fs_mkdir',
    'Create a directory in the OpenViking filesystem.',
    { uri: z.string().describe('OpenViking URI for the new directory'), ...tenantSchema },
    async ({ uri, account_id, user_id }) => {
      const r = await client.fetch(
        '/api/v1/fs/mkdir',
        { method: 'POST', body: JSON.stringify({ uri }) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_fs_delete ────────────────────────────────────────────────────────────
  server.tool(
    'ov_fs_delete',
    'Delete a resource from the OpenViking filesystem.',
    {
      uri:       z.string().describe('OpenViking URI to delete'),
      recursive: z.boolean().optional().describe('Delete recursively'),
      ...tenantSchema,
    },
    async ({ uri, recursive, account_id, user_id }) => {
      const params = new URLSearchParams({ uri });
      if (recursive != null) params.set('recursive', String(recursive));
      const r = await client.fetch(
        `/api/v1/fs?${params}`,
        { method: 'DELETE' },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_fs_move ──────────────────────────────────────────────────────────────
  server.tool(
    'ov_fs_move',
    'Move or rename a resource in the OpenViking filesystem.',
    {
      from_uri: z.string().describe('Source OpenViking URI'),
      to_uri:   z.string().describe('Destination OpenViking URI'),
      ...tenantSchema,
    },
    async ({ from_uri, to_uri, account_id, user_id }) => {
      const r = await client.fetch(
        '/api/v1/fs/mv',
        { method: 'POST', body: JSON.stringify({ from_uri, to_uri }) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );
}
