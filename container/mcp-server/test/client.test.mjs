import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, capturedCalls, resetMock } from './helpers/mock-fetch.mjs';
import { createClient, OvError, buildTenantHeaders, normalizeUriAlias, normalizeUriAliases } from '../src/client.mjs';

const cfg = { ovBase: 'http://127.0.0.1:1934', ovKey: 'test-key', mcpPort: 4050, collPath: '/' };

describe('buildTenantHeaders', () => {
  it('returns empty object when nothing supplied', () => {
    assert.deepEqual(buildTenantHeaders(), {});
  });
  it('only includes non-null fields', () => {
    const h = buildTenantHeaders({ account_id: 'acct1', user_id: null });
    assert.equal(h['X-OpenViking-Account'], 'acct1');
    assert.ok(!('X-OpenViking-User' in h));
  });
  it('includes all three fields when all supplied', () => {
    const h = buildTenantHeaders({ account_id: 'a', user_id: 'u', agent_id: 'g' });
    assert.equal(h['X-OpenViking-Account'], 'a');
    assert.equal(h['X-OpenViking-User'], 'u');
    assert.equal(h['X-OpenViking-Agent'], 'g');
  });
});

describe('normalizeUriAlias', () => {
  it('maps the legacy ov:/// root alias to resources scope', () => {
    assert.equal(normalizeUriAlias('ov:///'), 'viking://resources');
  });

  it('maps nested ov:/// paths into resources scope', () => {
    assert.equal(normalizeUriAlias('ov:///docs/note.md'), 'viking://resources/docs/note.md');
  });

  it('leaves native viking URIs unchanged', () => {
    assert.equal(normalizeUriAlias('viking://session/abc'), 'viking://session/abc');
  });

  it('normalizes URI arrays', () => {
    assert.deepEqual(
      normalizeUriAliases(['ov:///a', 'viking://resources/b']),
      ['viking://resources/a', 'viking://resources/b']
    );
  });
});

describe('createClient().fetch', () => {
  let client;
  beforeEach(() => { client = createClient(cfg); });
  afterEach(resetMock);

  it('injects Authorization header on GET', async () => {
    mockFetch({ status: 200, body: { status: 'ok', result: { foo: 1 } } });
    const result = await client.fetch('/api/v1/fs/ls?uri=ov%3A%2F%2F%2F');
    assert.equal(capturedCalls[0].opts.headers['Authorization'], 'Bearer test-key');
    assert.deepEqual(result, { foo: 1 });
  });

  it('injects Authorization header on POST with body', async () => {
    mockFetch({ status: 200, body: { status: 'ok', result: 'done' } });
    await client.fetch('/api/v1/fs/mkdir', { method: 'POST', body: JSON.stringify({ uri: 'ov:///dir' }) });
    const call = capturedCalls[0];
    assert.equal(call.opts.method, 'POST');
    assert.equal(call.opts.headers['Content-Type'], 'application/json');
    assert.equal(call.opts.headers['Authorization'], 'Bearer test-key');
  });

  it('merges tenant headers', async () => {
    mockFetch({ status: 200, body: { status: 'ok', result: [] } });
    await client.fetch('/api/v1/sessions', {}, { 'X-OpenViking-Account': 'acct1' });
    assert.equal(capturedCalls[0].opts.headers['X-OpenViking-Account'], 'acct1');
  });

  it('returns result field when present', async () => {
    mockFetch({ status: 200, body: { status: 'ok', result: [1, 2, 3] } });
    const r = await client.fetch('/api/v1/fs/ls?uri=ov%3A%2F%2F%2F');
    assert.deepEqual(r, [1, 2, 3]);
  });

  it('returns full body when no result field', async () => {
    mockFetch({ status: 200, body: { status: 'ok' } });
    const r = await client.fetch('/health');
    assert.deepEqual(r, { status: 'ok' });
  });

  it('throws OvError on non-2xx', async () => {
    mockFetch({ status: 401, body: { status: 'error', error: { code: 'UNAUTHENTICATED' } } });
    await assert.rejects(
      () => client.fetch('/api/v1/system/status'),
      (err) => {
        assert.ok(err instanceof OvError);
        assert.equal(err.status, 401);
        assert.equal(err.path, '/api/v1/system/status');
        return true;
      }
    );
  });

  it('throws OvError on 403', async () => {
    mockFetch({ status: 403, body: 'Permission denied' });
    await assert.rejects(
      () => client.fetch('/api/v1/admin/accounts'),
      (err) => err instanceof OvError && err.status === 403
    );
  });
});

describe('createClient().formPost', () => {
  let client;
  beforeEach(() => { client = createClient(cfg); });
  afterEach(resetMock);

  it('does NOT set Content-Type (lets fetch set multipart boundary)', async () => {
    mockFetch({ status: 200, body: { status: 'ok', result: { temp_path: '/tmp/x.md' } } });
    const fd = new FormData();
    fd.append('file', new Blob(['hello'], { type: 'text/plain' }), 'hello.md');
    await client.formPost('/api/v1/resources/temp_upload', fd);
    // Content-Type must NOT be present (browser sets it with boundary automatically)
    assert.ok(!('Content-Type' in (capturedCalls[0].opts.headers ?? {})));
    assert.equal(capturedCalls[0].opts.headers['Authorization'], 'Bearer test-key');
  });

  it('throws OvError on non-2xx from formPost', async () => {
    mockFetch({ status: 500, body: 'Internal server error' });
    const fd = new FormData();
    await assert.rejects(
      () => client.formPost('/api/v1/resources/temp_upload', fd),
      (err) => err instanceof OvError && err.status === 500
    );
  });
});
