/**
 * Backward-compatible aliases for the original 5 tools.
 * Each alias mirrors the behaviour of its new counterpart(s).
 */
import { z } from 'zod';
import { buildTenantHeaders, normalizeUriAlias } from '../client.mjs';

function text(v) {
  const str = typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  return { content: [{ type: 'text', text: str }] };
}

export function register(server, client, config) {
  // ── search_by_text → ov_search_find ─────────────────────────────────────────
  server.tool(
    'search_by_text',
    '[Legacy] Semantic search — alias for ov_search_find.',
    {
      query:           z.string().describe('Search query text'),
      top_k:           z.number().int().min(1).max(50).optional().describe('Max results (default 5)'),
      collection_path: z.string().optional().describe('Override collection path'),
    },
    async ({ query, top_k, collection_path }) => {
      const body = {
        query,
        collection_path: collection_path ?? config.collPath,
        ...(top_k != null && { limit: top_k }),
      };
      const r = await client.fetch(
        '/api/v1/search/find',
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({})
      );
      return text(r);
    }
  );

  // ── upsert_data → 3-step ingest pipeline ────────────────────────────────────
  server.tool(
    'upsert_data',
    '[Legacy] Upload a text document — alias for the 3-step ingest pipeline ' +
    '(ov_resources_temp_upload → ov_resources_create → ov_fs_move).',
    {
      content:         z.string().describe('Text content to store'),
      filename:        z.string().describe('Filename, e.g. notes.md'),
      collection_path: z.string().optional(),
    },
    async ({ content, filename, collection_path }) => {
      const dest = collection_path ?? config.collPath;
      // Step 1: temp_upload
      const form = new FormData();
      form.append('file', new Blob([content], { type: 'text/plain' }), filename);
      const { temp_path } = await client.formPost(
        '/api/v1/resources/temp_upload', form, buildTenantHeaders({})
      );
      // Step 2: create resource
      const { root_uri } = await client.fetch(
        '/api/v1/resources',
        { method: 'POST', body: JSON.stringify({ path: temp_path }) },
        buildTenantHeaders({})
      );
      // Step 3: move to collection
      const to_uri = normalizeUriAlias(`ov:///${dest.replace(/^\/+/, '')}/${filename}`);
      await client.fetch(
        '/api/v1/fs/mv',
        { method: 'POST', body: JSON.stringify({ from_uri: root_uri, to_uri }) },
        buildTenantHeaders({})
      );
      return text({ uri: to_uri, root_uri });
    }
  );

  // ── fetch_data → ls-first → ov_content_read ─────────────────────────────────
  server.tool(
    'fetch_data',
    '[Legacy] Read content from an OpenViking URI — alias for ov_fs_ls + ov_content_read.',
    {
      uri: z.string().describe('OpenViking URI e.g. ov:///path/to/file.md'),
    },
    async ({ uri }) => {
      const normalizedUri = normalizeUriAlias(uri);
      const entries = await client.fetch(
        `/api/v1/fs/ls?uri=${encodeURIComponent(normalizedUri)}`, {},
        buildTenantHeaders({})
      );
      const list = Array.isArray(entries) ? entries : [];
      const target = list.length === 1 && list[0] !== normalizedUri ? list[0] : normalizedUri;
      const r = await client.fetch(
        `/api/v1/content/read?uri=${encodeURIComponent(target)}`, {},
        buildTenantHeaders({})
      );
      return text(typeof r === 'string' ? r : JSON.stringify(r, null, 2));
    }
  );

  // ── list_collection → ov_fs_ls ───────────────────────────────────────────────
  server.tool(
    'list_collection',
    '[Legacy] List resources in a directory — alias for ov_fs_ls.',
    {
      uri: z.string().optional().describe('OpenViking directory URI (default: collection root)'),
    },
    async ({ uri }) => {
      const target = normalizeUriAlias(uri ?? `ov:///${config.collPath.replace(/^\/+/, '')}`);
      const r = await client.fetch(
        `/api/v1/fs/ls?uri=${encodeURIComponent(target)}`, {},
        buildTenantHeaders({})
      );
      return text(r);
    }
  );

  // ── delete_data → ov_fs_delete ───────────────────────────────────────────────
  server.tool(
    'delete_data',
    '[Legacy] Delete a resource — alias for ov_fs_delete.',
    {
      uri: z.string(),
    },
    async ({ uri }) => {
      const r = await client.fetch(
        `/api/v1/fs?uri=${encodeURIComponent(normalizeUriAlias(uri))}`,
        { method: 'DELETE' },
        buildTenantHeaders({})
      );
      return text(r);
    }
  );
}
