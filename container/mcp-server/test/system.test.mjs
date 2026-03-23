import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, capturedCalls, resetMock } from './helpers/mock-fetch.mjs';
import { createClient } from '../src/client.mjs';
import { register as registerHealth }   from '../src/tools/health.mjs';
import { register as registerSystem }   from '../src/tools/system.mjs';
import { register as registerObserver } from '../src/tools/observer.mjs';

const cfg = { ovBase: 'http://127.0.0.1:1934', ovKey: 'k', mcpPort: 4050, collPath: '/' };

function makeMockServer() {
  const tools = {};
  return { tool(name, _d, _s, h) { tools[name] = h; }, tools };
}

function ok(result = {}) {
  return { status: 200, body: { status: 'ok', result } };
}

describe('health / system / observer tools', () => {
  let server, client;
  beforeEach(() => {
    client = createClient(cfg);
    server = makeMockServer();
    registerHealth(server, client, cfg);
    registerSystem(server, client, cfg);
    registerObserver(server, client, cfg);
  });
  afterEach(resetMock);

  describe('ov_health_get', () => {
    it('GETs /health', async () => {
      mockFetch(ok({ status: 'ok' }));
      await server.tools['ov_health_get']({});
      assert.ok(capturedCalls[0].url.endsWith('/health'));
    });
  });

  describe('ov_ready_get', () => {
    it('GETs /ready', async () => {
      mockFetch(ok({ ready: true }));
      await server.tools['ov_ready_get']({});
      assert.ok(capturedCalls[0].url.endsWith('/ready'));
    });
  });

  describe('ov_system_status_get', () => {
    it('GETs /api/v1/system/status', async () => {
      mockFetch(ok({}));
      await server.tools['ov_system_status_get']({});
      assert.ok(capturedCalls[0].url.endsWith('/api/v1/system/status'));
    });
  });

  describe('ov_system_wait', () => {
    it('POSTs to /api/v1/system/wait', async () => {
      mockFetch(ok({}));
      await server.tools['ov_system_wait']({});
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/system/wait'));
    });

    it('includes timeout when provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_system_wait']({ timeout: 30 });
      assert.equal(JSON.parse(capturedCalls[0].opts.body).timeout, 30);
    });

    it('omits timeout when not provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_system_wait']({});
      assert.ok(!('timeout' in JSON.parse(capturedCalls[0].opts.body)));
    });
  });

  describe('observer tools', () => {
    const endpoints = [
      ['ov_observer_queue_get',    '/api/v1/observer/queue'],
      ['ov_observer_vikingdb_get', '/api/v1/observer/vikingdb'],
      ['ov_observer_vlm_get',      '/api/v1/observer/vlm'],
      ['ov_observer_system_get',   '/api/v1/observer/system'],
      ['ov_debug_health_get',      '/api/v1/debug/health'],
    ];

    for (const [toolName, expectedPath] of endpoints) {
      it(`${toolName} GETs ${expectedPath}`, async () => {
        mockFetch(ok({}));
        await server.tools[toolName]({});
        assert.ok(capturedCalls[0].url.endsWith(expectedPath));
        resetMock();
      });
    }
  });
});
