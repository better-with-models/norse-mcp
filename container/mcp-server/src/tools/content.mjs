import { z } from 'zod';
import { buildTenantHeaders, normalizeUriAlias } from '../client.mjs';

function text(v) {
  const str = typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  return { content: [{ type: 'text', text: str }] };
}

export function register(server, client, _config) {
  // ── ov_content_read ─────────────────────────────────────────────────────────
  // NOTE: Do NOT call on a top-level document URI — it returns empty string.
  // Use ov_fs_ls first to get the child hash URI, then call read on that.
  server.tool(
    'ov_content_read',
    'Read text content from an OpenViking URI. ' +
    'IMPORTANT: top-level document URIs resolve to an empty string — ' +
    'use ov_fs_ls first to get the child hash URI, then call this tool.',
    {
      uri:        z.string().describe('OpenViking URI (prefer child hash URI, not top-level)'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ uri, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/content/read?uri=${encodeURIComponent(normalizeUriAlias(uri))}`, {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_content_abstract ─────────────────────────────────────────────────────
  server.tool(
    'ov_content_abstract',
    'Get an AI-generated abstract for an OpenViking directory.',
    {
      uri:        z.string().describe('OpenViking directory URI'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ uri, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/content/abstract?uri=${encodeURIComponent(normalizeUriAlias(uri))}`, {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_content_overview ─────────────────────────────────────────────────────
  server.tool(
    'ov_content_overview',
    'Get an AI-generated overview for an OpenViking directory.',
    {
      uri:        z.string().describe('OpenViking directory URI'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ uri, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/content/overview?uri=${encodeURIComponent(normalizeUriAlias(uri))}`, {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );
}
