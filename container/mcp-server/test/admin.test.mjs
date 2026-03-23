import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, capturedCalls, resetMock } from './helpers/mock-fetch.mjs';
import { createClient } from '../src/client.mjs';
import { register } from '../src/tools/admin.mjs';

const cfg = { ovBase: 'http://127.0.0.1:1934', ovKey: 'k', mcpPort: 4050, collPath: '/' };

function makeMockServer() {
  const tools = {};
  return { tool(name, _d, _s, h) { tools[name] = h; }, tools };
}

function ok(result = {}) {
  return { status: 200, body: { status: 'ok', result } };
}

describe('admin tools', () => {
  let server, client;
  beforeEach(() => {
    client = createClient(cfg);
    server = makeMockServer();
    register(server, client, cfg);
  });
  afterEach(resetMock);

  describe('ov_admin_accounts_create', () => {
    it('POSTs to /api/v1/admin/accounts', async () => {
      mockFetch(ok({}));
      await server.tools['ov_admin_accounts_create']({
        account_id: 'acct1', admin_user_id: 'admin1',
      });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/admin/accounts'));
      const body = JSON.parse(call.opts.body);
      assert.equal(body.account_id, 'acct1');
      assert.equal(body.admin_user_id, 'admin1');
    });
  });

  describe('ov_admin_accounts_list', () => {
    it('GETs /api/v1/admin/accounts', async () => {
      mockFetch(ok([]));
      await server.tools['ov_admin_accounts_list']({});
      assert.ok(capturedCalls[0].url.endsWith('/api/v1/admin/accounts'));
    });
  });

  describe('ov_admin_accounts_delete', () => {
    it('DELETEs /api/v1/admin/accounts/{account_id}', async () => {
      mockFetch(ok({}));
      await server.tools['ov_admin_accounts_delete']({ account_id: 'acct1' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'DELETE');
      assert.ok(call.url.endsWith('/api/v1/admin/accounts/acct1'));
    });
  });

  describe('ov_admin_users_create', () => {
    it('POSTs to /api/v1/admin/accounts/{account_id}/users', async () => {
      mockFetch(ok({}));
      await server.tools['ov_admin_users_create']({
        account_id: 'acct1', user_id: 'user1',
      });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/admin/accounts/acct1/users'));
      assert.equal(JSON.parse(call.opts.body).user_id, 'user1');
    });

    it('includes role when provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_admin_users_create']({
        account_id: 'acct1', user_id: 'user1', role: 'admin',
      });
      assert.equal(JSON.parse(capturedCalls[0].opts.body).role, 'admin');
    });

    it('omits role when not provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_admin_users_create']({ account_id: 'a', user_id: 'u' });
      assert.ok(!('role' in JSON.parse(capturedCalls[0].opts.body)));
    });
  });

  describe('ov_admin_users_list', () => {
    it('GETs /api/v1/admin/accounts/{account_id}/users', async () => {
      mockFetch(ok([]));
      await server.tools['ov_admin_users_list']({ account_id: 'acct1' });
      assert.ok(capturedCalls[0].url.endsWith('/api/v1/admin/accounts/acct1/users'));
    });
  });

  describe('ov_admin_users_delete', () => {
    it('DELETEs /api/v1/admin/accounts/{account_id}/users/{user_id}', async () => {
      mockFetch(ok({}));
      await server.tools['ov_admin_users_delete']({ account_id: 'acct1', user_id: 'user1' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'DELETE');
      assert.ok(call.url.endsWith('/api/v1/admin/accounts/acct1/users/user1'));
    });
  });

  describe('ov_admin_user_role_update', () => {
    it('PUTs to /api/v1/admin/accounts/{account_id}/users/{user_id}/role', async () => {
      mockFetch(ok({}));
      await server.tools['ov_admin_user_role_update']({
        account_id: 'acct1', user_id: 'user1', role: 'admin',
      });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'PUT');
      assert.ok(call.url.endsWith('/api/v1/admin/accounts/acct1/users/user1/role'));
      assert.equal(JSON.parse(call.opts.body).role, 'admin');
    });
  });

  describe('ov_admin_user_key_create', () => {
    it('POSTs to /api/v1/admin/accounts/{account_id}/users/{user_id}/key', async () => {
      mockFetch(ok({ key: 'abc123' }));
      await server.tools['ov_admin_user_key_create']({ account_id: 'acct1', user_id: 'user1' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/admin/accounts/acct1/users/user1/key'));
    });
  });
});
