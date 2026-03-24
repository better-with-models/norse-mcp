import { z } from 'zod';
import { buildTenantHeaders, normalizeUriAlias } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, config) {
  // ── ov_search_find ──────────────────────────────────────────────────────────
  server.tool(
    'ov_search_find',
    'Semantic search over the local OpenViking vector store.',
    {
      query:           z.string().describe('Search query text'),
      target_uri:      z.string().optional().describe('Restrict search to a subtree URI'),
      limit:           z.number().int().min(1).max(50).optional().describe('Max results (default 5)'),
      score_threshold: z.number().optional().describe('Minimum similarity score'),
      account_id:      z.string().optional(),
      user_id:         z.string().optional(),
    },
    async ({ query, target_uri, limit, score_threshold, account_id, user_id }) => {
      const body = {
        query,
        collection_path: config.collPath,
        ...(target_uri      != null && { target_uri: normalizeUriAlias(target_uri) }),
        ...(limit           != null && { limit }),
        ...(score_threshold != null && { score_threshold }),
      };
      const r = await client.fetch(
        '/api/v1/search/find',
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_search_search ────────────────────────────────────────────────────────
  server.tool(
    'ov_search_search',
    'Context-aware search that can incorporate session history.',
    {
      query:      z.string().describe('Search query text'),
      session_id: z.string().optional().describe('Session ID for context-aware search'),
      limit:      z.number().int().min(1).max(50).optional(),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ query, session_id, limit, account_id, user_id }) => {
      const body = {
        query,
        ...(session_id != null && { session_id }),
        ...(limit      != null && { limit }),
      };
      const r = await client.fetch(
        '/api/v1/search/search',
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_search_grep ──────────────────────────────────────────────────────────
  server.tool(
    'ov_search_grep',
    'Regex/pattern search across files in a directory URI.',
    {
      uri:              z.string().describe('OpenViking URI to search within'),
      pattern:          z.string().describe('Regex pattern'),
      case_insensitive: z.boolean().optional(),
      account_id:       z.string().optional(),
      user_id:          z.string().optional(),
    },
    async ({ uri, pattern, case_insensitive, account_id, user_id }) => {
      const body = {
        uri: normalizeUriAlias(uri),
        pattern,
        ...(case_insensitive != null && { case_insensitive }),
      };
      const r = await client.fetch(
        '/api/v1/search/grep',
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_search_glob ──────────────────────────────────────────────────────────
  server.tool(
    'ov_search_glob',
    'Glob pattern file matching in the OpenViking filesystem.',
    {
      pattern:    z.string().describe('Glob pattern, e.g. "**/*.md"'),
      uri:        z.string().optional().describe('Root URI to match within (optional)'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ pattern, uri, account_id, user_id }) => {
      const body = {
        pattern,
        ...(uri != null && { uri: normalizeUriAlias(uri) }),
      };
      const r = await client.fetch(
        '/api/v1/search/glob',
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );
}
