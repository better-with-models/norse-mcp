import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, capturedCalls, resetMock } from './helpers/mock-fetch.mjs';
import { createClient } from '../src/client.mjs';
import { register } from '../src/tools/filesystem.mjs';

const cfg = { ovBase: 'http://127.0.0.1:1934', ovKey: 'k', mcpPort: 4050, collPath: '/' };

// Minimal mock McpServer — collects registered tools
function makeMockServer() {
  const tools = {};
  return {
    tool(name, _desc, _schema, handler) { tools[name] = handler; },
    tools,
  };
}

function ok(result = {}) {
  return { status: 200, body: { status: 'ok', result } };
}

describe('filesystem tools', () => {
  let server, client;
  beforeEach(() => {
    client = createClient(cfg);
    server = makeMockServer();
    register(server, client, cfg);
  });
  afterEach(resetMock);

  describe('ov_fs_ls', () => {
    it('builds correct GET URL with uri', async () => {
      mockFetch(ok(['ov:///a', 'ov:///b']));
      const r = await server.tools['ov_fs_ls']({ uri: 'ov:///' });
      assert.ok(capturedCalls[0].url.includes('/api/v1/fs/ls'));
      assert.ok(capturedCalls[0].url.includes(encodeURIComponent('viking://resources')));
      assert.ok(r.content[0].text.includes('ov:///a'));
    });
    it('appends simple=true when set', async () => {
      mockFetch(ok([]));
      await server.tools['ov_fs_ls']({ uri: 'ov:///', simple: true });
      assert.ok(capturedCalls[0].url.includes('simple=true'));
    });
    it('appends recursive=true when set', async () => {
      mockFetch(ok([]));
      await server.tools['ov_fs_ls']({ uri: 'ov:///', recursive: true });
      assert.ok(capturedCalls[0].url.includes('recursive=true'));
    });
    it('injects tenant headers when provided', async () => {
      mockFetch(ok([]));
      await server.tools['ov_fs_ls']({ uri: 'ov:///', account_id: 'acct1', user_id: 'u1' });
      assert.equal(capturedCalls[0].opts.headers['X-OpenViking-Account'], 'acct1');
    });
  });

  describe('ov_fs_tree', () => {
    it('calls /api/v1/fs/tree with encoded uri', async () => {
      mockFetch(ok([]));
      await server.tools['ov_fs_tree']({ uri: 'ov:///dir' });
      assert.ok(capturedCalls[0].url.includes('/api/v1/fs/tree'));
      assert.ok(capturedCalls[0].url.includes(encodeURIComponent('viking://resources/dir')));
    });
  });

  describe('ov_fs_stat', () => {
    it('calls /api/v1/fs/stat', async () => {
      mockFetch(ok({ name: 'file.md', isDir: false }));
      await server.tools['ov_fs_stat']({ uri: 'ov:///file.md' });
      assert.ok(capturedCalls[0].url.includes('/api/v1/fs/stat'));
    });
  });

  describe('ov_fs_mkdir', () => {
    it('POSTs to /api/v1/fs/mkdir with uri body', async () => {
      mockFetch(ok({ uri: 'ov:///newdir' }));
      await server.tools['ov_fs_mkdir']({ uri: 'ov:///newdir' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/fs/mkdir'));
      assert.equal(JSON.parse(call.opts.body).uri, 'viking://resources/newdir');
    });
  });

  describe('ov_fs_delete', () => {
    it('sends DELETE with uri query param', async () => {
      mockFetch(ok({ uri: 'ov:///file.md' }));
      await server.tools['ov_fs_delete']({ uri: 'ov:///file.md' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'DELETE');
      assert.ok(call.url.includes('/api/v1/fs'));
      assert.ok(call.url.includes('uri='));
    });
    it('appends recursive=true when set', async () => {
      mockFetch(ok({}));
      await server.tools['ov_fs_delete']({ uri: 'ov:///dir', recursive: true });
      assert.ok(capturedCalls[0].url.includes('recursive=true'));
    });
  });

  describe('ov_fs_move', () => {
    it('POSTs to /api/v1/fs/mv with from_uri and to_uri', async () => {
      mockFetch(ok({ from: 'ov:///a', to: 'ov:///b' }));
      await server.tools['ov_fs_move']({ from_uri: 'ov:///a', to_uri: 'ov:///b' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/fs/mv'));
      const body = JSON.parse(call.opts.body);
      assert.equal(body.from_uri, 'viking://resources/a');
      assert.equal(body.to_uri,   'viking://resources/b');
    });
  });
});
