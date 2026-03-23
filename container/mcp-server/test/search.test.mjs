import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, capturedCalls, resetMock } from './helpers/mock-fetch.mjs';
import { createClient } from '../src/client.mjs';
import { register } from '../src/tools/search.mjs';

const cfg = { ovBase: 'http://127.0.0.1:1934', ovKey: 'k', mcpPort: 4050, collPath: '/my-coll' };

function makeMockServer() {
  const tools = {};
  return { tool(name, _d, _s, h) { tools[name] = h; }, tools };
}

function ok(result = []) {
  return { status: 200, body: { status: 'ok', result } };
}

describe('search tools', () => {
  let server, client;
  beforeEach(() => {
    client = createClient(cfg);
    server = makeMockServer();
    register(server, client, cfg);
  });
  afterEach(resetMock);

  describe('ov_search_find', () => {
    it('POSTs to /api/v1/search/find with query and collPath', async () => {
      mockFetch(ok([{ uri: 'ov:///x' }]));
      await server.tools['ov_search_find']({ query: 'eigenvalues' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/search/find'));
      const body = JSON.parse(call.opts.body);
      assert.equal(body.query, 'eigenvalues');
      assert.equal(body.collection_path, '/my-coll');
    });
    it('includes optional fields when provided', async () => {
      mockFetch(ok([]));
      await server.tools['ov_search_find']({ query: 'q', limit: 10, score_threshold: 0.7 });
      const body = JSON.parse(capturedCalls[0].opts.body);
      assert.equal(body.limit, 10);
      assert.equal(body.score_threshold, 0.7);
    });
    it('omits optional fields when not provided', async () => {
      mockFetch(ok([]));
      await server.tools['ov_search_find']({ query: 'q' });
      const body = JSON.parse(capturedCalls[0].opts.body);
      assert.ok(!('limit' in body));
      assert.ok(!('score_threshold' in body));
    });
  });

  describe('ov_search_search', () => {
    it('POSTs to /api/v1/search/search with query', async () => {
      mockFetch(ok([]));
      await server.tools['ov_search_search']({ query: 'Fourier series' });
      const call = capturedCalls[0];
      assert.ok(call.url.endsWith('/api/v1/search/search'));
      assert.equal(JSON.parse(call.opts.body).query, 'Fourier series');
    });
    it('includes session_id when provided', async () => {
      mockFetch(ok([]));
      await server.tools['ov_search_search']({ query: 'q', session_id: 'sess123' });
      assert.equal(JSON.parse(capturedCalls[0].opts.body).session_id, 'sess123');
    });
  });

  describe('ov_search_grep', () => {
    it('POSTs uri + pattern to /api/v1/search/grep', async () => {
      mockFetch(ok([]));
      await server.tools['ov_search_grep']({ uri: 'ov:///notes', pattern: 'theorem' });
      const body = JSON.parse(capturedCalls[0].opts.body);
      assert.equal(body.uri, 'ov:///notes');
      assert.equal(body.pattern, 'theorem');
    });
    it('includes case_insensitive when set', async () => {
      mockFetch(ok([]));
      await server.tools['ov_search_grep']({ uri: 'ov:///x', pattern: 'p', case_insensitive: true });
      assert.equal(JSON.parse(capturedCalls[0].opts.body).case_insensitive, true);
    });
  });

  describe('ov_search_glob', () => {
    it('POSTs pattern to /api/v1/search/glob', async () => {
      mockFetch(ok([]));
      await server.tools['ov_search_glob']({ pattern: '**/*.md' });
      const body = JSON.parse(capturedCalls[0].opts.body);
      assert.equal(body.pattern, '**/*.md');
      assert.ok(!('uri' in body));
    });
    it('includes uri when provided', async () => {
      mockFetch(ok([]));
      await server.tools['ov_search_glob']({ pattern: '*.md', uri: 'ov:///docs' });
      assert.equal(JSON.parse(capturedCalls[0].opts.body).uri, 'ov:///docs');
    });
  });
});
