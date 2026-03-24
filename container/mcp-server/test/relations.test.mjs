import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, capturedCalls, resetMock } from './helpers/mock-fetch.mjs';
import { createClient } from '../src/client.mjs';
import { register } from '../src/tools/relations.mjs';

const cfg = { ovBase: 'http://127.0.0.1:1934', ovKey: 'k', mcpPort: 4050, collPath: '/' };

function makeMockServer() {
  const tools = {};
  return { tool(name, _d, _s, h) { tools[name] = h; }, tools };
}

function ok(result = {}) {
  return { status: 200, body: { status: 'ok', result } };
}

describe('relations tools', () => {
  let server, client;
  beforeEach(() => {
    client = createClient(cfg);
    server = makeMockServer();
    register(server, client, cfg);
  });
  afterEach(resetMock);

  describe('ov_relations_get', () => {
    it('GETs /api/v1/relations with uri query param', async () => {
      mockFetch(ok([]));
      await server.tools['ov_relations_get']({ uri: 'ov:///doc.md' });
      const call = capturedCalls[0];
      assert.ok(!call.opts.method || call.opts.method === 'GET' || call.opts.method === undefined);
      assert.ok(call.url.includes('/api/v1/relations'));
      assert.ok(call.url.includes(encodeURIComponent('viking://resources/doc.md')));
    });

    it('injects tenant headers when provided', async () => {
      mockFetch(ok([]));
      await server.tools['ov_relations_get']({ uri: 'ov:///x', account_id: 'a1', user_id: 'u1' });
      assert.equal(capturedCalls[0].opts.headers['X-OpenViking-Account'], 'a1');
    });
  });

  describe('ov_relations_link', () => {
    it('POSTs to /api/v1/relations/link with from_uri and to_uris', async () => {
      mockFetch(ok({}));
      await server.tools['ov_relations_link']({
        from_uri: 'ov:///a', to_uris: ['ov:///b', 'ov:///c'],
      });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/relations/link'));
      const body = JSON.parse(call.opts.body);
      assert.equal(body.from_uri, 'viking://resources/a');
      assert.deepEqual(body.to_uris, ['viking://resources/b', 'viking://resources/c']);
    });

    it('includes reason when provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_relations_link']({
        from_uri: 'ov:///a', to_uris: ['ov:///b'], reason: 'prerequisite',
      });
      assert.equal(JSON.parse(capturedCalls[0].opts.body).reason, 'prerequisite');
    });

    it('omits reason when not provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_relations_link']({ from_uri: 'ov:///a', to_uris: ['ov:///b'] });
      assert.ok(!('reason' in JSON.parse(capturedCalls[0].opts.body)));
    });
  });

  describe('ov_relations_unlink', () => {
    it('DELETEs /api/v1/relations/link with from_uri and to_uris', async () => {
      mockFetch(ok({}));
      await server.tools['ov_relations_unlink']({
        from_uri: 'ov:///a', to_uris: ['ov:///b'],
      });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'DELETE');
      assert.ok(call.url.endsWith('/api/v1/relations/link'));
      const body = JSON.parse(call.opts.body);
      assert.equal(body.from_uri, 'viking://resources/a');
      assert.deepEqual(body.to_uris, ['viking://resources/b']);
    });
  });
});
