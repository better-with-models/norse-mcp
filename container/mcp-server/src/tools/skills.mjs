/**
 * Item-level CRUD within OpenViking collections.
 * ("Skills" is the OpenViking term for stored knowledge items.)
 */
import { z } from 'zod';
import { buildTenantHeaders } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  // ── nordic_upsert_item ───────────────────────────────────────────────────────
  server.tool(
    'nordic_upsert_item',
    'Insert or update one or more items in a collection.',
    {
      collection: z.string().describe('Collection name'),
      items: z.array(z.object({
        id:       z.string(),
        text:     z.string(),
        metadata: z.record(z.unknown()).optional(),
      })).describe('Array of items to upsert. Each item must have an id and text.'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ collection, items, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/collections/${encodeURIComponent(collection)}/items`,
        { method: 'POST', body: JSON.stringify({ items }) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── nordic_fetch_item ────────────────────────────────────────────────────────
  server.tool(
    'nordic_fetch_item',
    'Fetch a stored item by its ID.',
    {
      collection: z.string().describe('Collection name'),
      id:         z.string().describe('Item ID'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ collection, id, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/collections/${encodeURIComponent(collection)}/items/${encodeURIComponent(id)}`,
        {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── nordic_delete_item ───────────────────────────────────────────────────────
  server.tool(
    'nordic_delete_item',
    'Delete a stored item by its ID.',
    {
      collection: z.string().describe('Collection name'),
      id:         z.string().describe('Item ID'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ collection, id, account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/collections/${encodeURIComponent(collection)}/items/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── nordic_list_items ────────────────────────────────────────────────────────
  server.tool(
    'nordic_list_items',
    'List items in a collection with optional pagination.',
    {
      collection: z.string().describe('Collection name'),
      limit:      z.number().int().min(1).optional().describe('Max results (default 20)'),
      offset:     z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ collection, limit, offset, account_id, user_id }) => {
      const params = new URLSearchParams();
      params.set('limit',  String(limit  ?? 20));
      params.set('offset', String(offset ?? 0));
      const r = await client.fetch(
        `/api/v1/collections/${encodeURIComponent(collection)}/items?${params}`,
        {},
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );
}
