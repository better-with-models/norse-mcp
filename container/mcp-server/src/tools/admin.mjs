import { z } from 'zod';
import { buildTenantHeaders } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  // ── ov_admin_accounts_create ─────────────────────────────────────────────────
  server.tool(
    'ov_admin_accounts_create',
    'Create a new OpenViking account (ROOT key required).',
    {
      account_id:    z.string().describe('Unique account identifier'),
      admin_user_id: z.string().describe('User ID to set as account admin'),
    },
    async ({ account_id, admin_user_id }) => {
      const r = await client.fetch(
        '/api/v1/admin/accounts',
        { method: 'POST', body: JSON.stringify({ account_id, admin_user_id }) },
        buildTenantHeaders({})
      );
      return text(r);
    }
  );

  // ── ov_admin_accounts_list ───────────────────────────────────────────────────
  server.tool(
    'ov_admin_accounts_list',
    'List all OpenViking accounts (ROOT key required).',
    {},
    async () => {
      const r = await client.fetch('/api/v1/admin/accounts', {}, buildTenantHeaders({}));
      return text(r);
    }
  );

  // ── ov_admin_accounts_delete ─────────────────────────────────────────────────
  server.tool(
    'ov_admin_accounts_delete',
    'Delete an OpenViking account (ROOT key required).',
    {
      account_id: z.string().describe('Account ID to delete'),
    },
    async ({ account_id }) => {
      const r = await client.fetch(
        `/api/v1/admin/accounts/${encodeURIComponent(account_id)}`,
        { method: 'DELETE' },
        buildTenantHeaders({})
      );
      return text(r);
    }
  );

  // ── ov_admin_users_create ────────────────────────────────────────────────────
  server.tool(
    'ov_admin_users_create',
    'Create a user within an OpenViking account (ROOT key required).',
    {
      account_id: z.string().describe('Account ID'),
      user_id:    z.string().describe('New user ID'),
      role:       z.string().optional().describe('User role (e.g. admin, user)'),
    },
    async ({ account_id, user_id, role }) => {
      const body = {
        user_id,
        ...(role != null && { role }),
      };
      const r = await client.fetch(
        `/api/v1/admin/accounts/${encodeURIComponent(account_id)}/users`,
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({})
      );
      return text(r);
    }
  );

  // ── ov_admin_users_list ──────────────────────────────────────────────────────
  server.tool(
    'ov_admin_users_list',
    'List all users in an OpenViking account (ROOT key required).',
    {
      account_id: z.string().describe('Account ID'),
    },
    async ({ account_id }) => {
      const r = await client.fetch(
        `/api/v1/admin/accounts/${encodeURIComponent(account_id)}/users`,
        {},
        buildTenantHeaders({})
      );
      return text(r);
    }
  );

  // ── ov_admin_users_delete ────────────────────────────────────────────────────
  server.tool(
    'ov_admin_users_delete',
    'Delete a user from an OpenViking account (ROOT key required).',
    {
      account_id: z.string().describe('Account ID'),
      user_id:    z.string().describe('User ID to delete'),
    },
    async ({ account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/admin/accounts/${encodeURIComponent(account_id)}/users/${encodeURIComponent(user_id)}`,
        { method: 'DELETE' },
        buildTenantHeaders({})
      );
      return text(r);
    }
  );

  // ── ov_admin_user_role_update ────────────────────────────────────────────────
  server.tool(
    'ov_admin_user_role_update',
    'Update the role of a user within an OpenViking account (ROOT key required).',
    {
      account_id: z.string().describe('Account ID'),
      user_id:    z.string().describe('User ID'),
      role:       z.string().describe('New role value'),
    },
    async ({ account_id, user_id, role }) => {
      const r = await client.fetch(
        `/api/v1/admin/accounts/${encodeURIComponent(account_id)}/users/${encodeURIComponent(user_id)}/role`,
        { method: 'PUT', body: JSON.stringify({ role }) },
        buildTenantHeaders({})
      );
      return text(r);
    }
  );

  // ── ov_admin_user_key_create ─────────────────────────────────────────────────
  server.tool(
    'ov_admin_user_key_create',
    'Create an API key for a user in an OpenViking account (ROOT key required).',
    {
      account_id: z.string().describe('Account ID'),
      user_id:    z.string().describe('User ID'),
    },
    async ({ account_id, user_id }) => {
      const r = await client.fetch(
        `/api/v1/admin/accounts/${encodeURIComponent(account_id)}/users/${encodeURIComponent(user_id)}/key`,
        { method: 'POST', body: JSON.stringify({}) },
        buildTenantHeaders({})
      );
      return text(r);
    }
  );
}
