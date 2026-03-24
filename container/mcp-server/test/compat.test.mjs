import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, capturedCalls, resetMock } from './helpers/mock-fetch.mjs';
import { createClient } from '../src/client.mjs';
import { register } from '../src/tools/compat.mjs';

const cfg = { ovBase: 'http://127.0.0.1:1934', ovKey: 'k', mcpPort: 4050, collPath: '/my-coll' };

function makeMockServer() {
  const tools = {};
  return { tool(name, _d, _s, h) { tools[name] = h; }, tools };
}

function ok(result) {
  return { status: 200, body: { status: 'ok', result } };
}

describe('compat aliases', () => {
  let server, client;
  beforeEach(() => {
    client = createClient(cfg);
    server = makeMockServer();
    register(server, client, cfg);
  });
  afterEach(resetMock);

  describe('search_by_text → ov_search_find', () => {
    it('POSTs to /api/v1/search/find with query and collPath', async () => {
      mockFetch(ok([]));
      await server.tools['search_by_text']({ query: 'eigenvalues' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/search/find'));
      const body = JSON.parse(call.opts.body);
      assert.equal(body.query, 'eigenvalues');
      assert.equal(body.collection_path, '/my-coll');
    });

    it('maps top_k to limit', async () => {
      mockFetch(ok([]));
      await server.tools['search_by_text']({ query: 'q', top_k: 10 });
      assert.equal(JSON.parse(capturedCalls[0].opts.body).limit, 10);
    });

    it('respects collection_path override', async () => {
      mockFetch(ok([]));
      await server.tools['search_by_text']({ query: 'q', collection_path: '/other' });
      assert.equal(JSON.parse(capturedCalls[0].opts.body).collection_path, '/other');
    });
  });

  describe('upsert_data → 3-step ingest', () => {
    it('calls temp_upload, resources/create, and fs/mv in sequence', async () => {
      let callCount = 0;
      globalThis.fetch = async (_url, _opts) => {
        callCount++;
        const bodies = [
          { status: 'ok', result: { temp_path: '/tmp/x.md' } },
          { status: 'ok', result: { root_uri: 'viking://resources/abc' } },
          { status: 'ok', result: {} },
        ];
        const body = bodies[callCount - 1] ?? { status: 'ok', result: {} };
        return {
          ok: true, status: 200,
          text: async () => JSON.stringify(body),
          json: async () => body,
        };
      };

      const result = await server.tools['upsert_data']({
        content: '# Hello', filename: 'hello.md',
      });
      assert.equal(callCount, 3);
      assert.ok(result.content[0].text.includes('hello.md'));
    });
  });

  describe('fetch_data → ls-first + content/read', () => {
    it('calls fs/ls then content/read', async () => {
      let callCount = 0;
      globalThis.fetch = async (_url, _opts) => {
        callCount++;
        const bodies = [
          { status: 'ok', result: ['ov:///abc123'] },
          { status: 'ok', result: 'Hello world' },
        ];
        const body = bodies[callCount - 1];
        return {
          ok: true, status: 200,
          text: async () => JSON.stringify(body),
          json: async () => body,
        };
      };

      const result = await server.tools['fetch_data']({ uri: 'ov:///doc.md' });
      assert.equal(callCount, 2);
      assert.ok(result.content[0].text.includes('Hello world'));
    });
  });

  describe('list_collection → ov_fs_ls', () => {
    it('GETs /api/v1/fs/ls with collection root when no uri given', async () => {
      mockFetch(ok(['ov:///my-coll/a.md']));
      await server.tools['list_collection']({});
      assert.ok(capturedCalls[0].url.includes('/api/v1/fs/ls'));
      assert.ok(capturedCalls[0].url.includes(encodeURIComponent('viking://resources/my-coll')));
    });

    it('uses provided uri', async () => {
      mockFetch(ok([]));
      await server.tools['list_collection']({ uri: 'ov:///custom' });
      assert.ok(capturedCalls[0].url.includes(encodeURIComponent('viking://resources/custom')));
    });
  });

  describe('delete_data → ov_fs_delete', () => {
    it('DELETEs /api/v1/fs with uri param', async () => {
      mockFetch(ok({}));
      await server.tools['delete_data']({ uri: 'ov:///file.md' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'DELETE');
      assert.ok(call.url.includes('/api/v1/fs'));
      assert.ok(call.url.includes(encodeURIComponent('viking://resources/file.md')));
    });
  });
});
