import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, capturedCalls, resetMock } from './helpers/mock-fetch.mjs';
import { createClient } from '../src/client.mjs';
import { register } from '../src/tools/resources.mjs';

const cfg = { ovBase: 'http://127.0.0.1:1934', ovKey: 'k', mcpPort: 4050, collPath: '/' };

function makeMockServer() {
  const tools = {};
  return { tool(name, _d, _s, h) { tools[name] = h; }, tools };
}

function ok(result = {}) {
  return { status: 200, body: { status: 'ok', result } };
}

describe('resources tools', () => {
  let server, client;
  beforeEach(() => {
    client = createClient(cfg);
    server = makeMockServer();
    register(server, client, cfg);
  });
  afterEach(resetMock);

  describe('ov_resources_temp_upload', () => {
    it('POSTs to /api/v1/resources/temp_upload as multipart', async () => {
      mockFetch(ok({ temp_path: '/tmp/abc.md' }));
      await server.tools['ov_resources_temp_upload']({
        content: '# Hello', filename: 'hello.md',
      });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/resources/temp_upload'));
      // FormData body — not JSON
      assert.ok(call.opts.body instanceof FormData);
    });

    it('uses text/plain as default mime_type', async () => {
      mockFetch(ok({ temp_path: '/tmp/x' }));
      await server.tools['ov_resources_temp_upload']({ content: 'hi', filename: 'x.txt' });
      const fd = capturedCalls[0].opts.body;
      const blob = fd.get('file');
      assert.ok(blob instanceof Blob);
      assert.equal(blob.type, 'text/plain');
    });

    it('uses provided mime_type', async () => {
      mockFetch(ok({ temp_path: '/tmp/y' }));
      await server.tools['ov_resources_temp_upload']({
        content: '<h1>hi</h1>', filename: 'y.html', mime_type: 'text/html',
      });
      const blob = capturedCalls[0].opts.body.get('file');
      assert.equal(blob.type, 'text/html');
    });

    it('injects tenant headers when provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_resources_temp_upload']({
        content: 'x', filename: 'x.md', account_id: 'acct1', user_id: 'u1',
      });
      assert.equal(capturedCalls[0].opts.headers['X-OpenViking-Account'], 'acct1');
      assert.equal(capturedCalls[0].opts.headers['X-OpenViking-User'], 'u1');
    });
  });

  describe('ov_resources_create', () => {
    it('POSTs to /api/v1/resources with required path', async () => {
      mockFetch(ok({ root_uri: 'viking://resources/abc' }));
      await server.tools['ov_resources_create']({ path: '/tmp/abc.md' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/resources'));
      assert.equal(JSON.parse(call.opts.body).path, '/tmp/abc.md');
    });

    it('includes optional fields when provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_resources_create']({
        path: '/tmp/x.md',
        target: 'viking://resources/dest',
        reason: 'test ingest',
        instruction: 'summarise',
        wait: true,
        timeout: 30,
        watch_interval: 5,
      });
      const body = JSON.parse(capturedCalls[0].opts.body);
      assert.equal(body.target, 'viking://resources/dest');
      assert.equal(body.reason, 'test ingest');
      assert.equal(body.instruction, 'summarise');
      assert.equal(body.wait, true);
      assert.equal(body.timeout, 30);
      assert.equal(body.watch_interval, 5);
    });

    it('omits optional fields when not provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_resources_create']({ path: '/tmp/x.md' });
      const body = JSON.parse(capturedCalls[0].opts.body);
      assert.ok(!('target' in body));
      assert.ok(!('reason' in body));
      assert.ok(!('wait' in body));
    });
  });

  describe('ov_skills_create', () => {
    it('POSTs to /api/v1/skills with data', async () => {
      mockFetch(ok({ skill_id: 's1' }));
      await server.tools['ov_skills_create']({ data: { name: 'my-skill' } });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/skills'));
      assert.deepEqual(JSON.parse(call.opts.body).data, { name: 'my-skill' });
    });

    it('accepts string data', async () => {
      mockFetch(ok({}));
      await server.tools['ov_skills_create']({ data: '/path/to/skill.yaml' });
      assert.equal(JSON.parse(capturedCalls[0].opts.body).data, '/path/to/skill.yaml');
    });

    it('injects tenant headers when provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_skills_create']({
        data: 'x', account_id: 'acct2', user_id: 'u2',
      });
      assert.equal(capturedCalls[0].opts.headers['X-OpenViking-Account'], 'acct2');
    });
  });
});
