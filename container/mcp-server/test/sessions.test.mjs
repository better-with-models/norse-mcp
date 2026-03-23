import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, capturedCalls, resetMock } from './helpers/mock-fetch.mjs';
import { createClient } from '../src/client.mjs';
import { register as registerSessions } from '../src/tools/sessions.mjs';
import { register as registerTasks }   from '../src/tools/tasks.mjs';

const cfg = { ovBase: 'http://127.0.0.1:1934', ovKey: 'k', mcpPort: 4050, collPath: '/' };

function makeMockServer() {
  const tools = {};
  return { tool(name, _d, _s, h) { tools[name] = h; }, tools };
}

function ok(result = {}) {
  return { status: 200, body: { status: 'ok', result } };
}

describe('sessions tools', () => {
  let server, client;
  beforeEach(() => {
    client = createClient(cfg);
    server = makeMockServer();
    registerSessions(server, client, cfg);
    registerTasks(server, client, cfg);
  });
  afterEach(resetMock);

  describe('ov_sessions_create', () => {
    it('POSTs to /api/v1/sessions', async () => {
      mockFetch(ok({ id: 'sess-1' }));
      await server.tools['ov_sessions_create']({});
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/sessions'));
    });
  });

  describe('ov_sessions_list', () => {
    it('GETs /api/v1/sessions', async () => {
      mockFetch(ok([]));
      await server.tools['ov_sessions_list']({});
      assert.ok(capturedCalls[0].url.endsWith('/api/v1/sessions'));
    });
  });

  describe('ov_sessions_get', () => {
    it('GETs /api/v1/sessions/{id}', async () => {
      mockFetch(ok({ id: 'sess-1' }));
      await server.tools['ov_sessions_get']({ id: 'sess-1' });
      assert.ok(capturedCalls[0].url.endsWith('/api/v1/sessions/sess-1'));
    });
  });

  describe('ov_sessions_delete', () => {
    it('DELETEs /api/v1/sessions/{id}', async () => {
      mockFetch(ok({}));
      await server.tools['ov_sessions_delete']({ id: 'sess-1' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'DELETE');
      assert.ok(call.url.endsWith('/api/v1/sessions/sess-1'));
    });
  });

  describe('ov_sessions_add_message', () => {
    it('POSTs to /api/v1/sessions/{id}/messages with role and content', async () => {
      mockFetch(ok({}));
      await server.tools['ov_sessions_add_message']({
        id: 'sess-1', role: 'user', content: 'Hello',
      });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/sessions/sess-1/messages'));
      const body = JSON.parse(call.opts.body);
      assert.equal(body.role, 'user');
      assert.equal(body.content, 'Hello');
    });

    it('includes parts when provided', async () => {
      mockFetch(ok({}));
      const parts = [{ type: 'text', text: 'Hi' }];
      await server.tools['ov_sessions_add_message']({ id: 'sess-1', role: 'user', parts });
      assert.deepEqual(JSON.parse(capturedCalls[0].opts.body).parts, parts);
    });

    it('omits content/parts when not provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_sessions_add_message']({ id: 'sess-1', role: 'assistant' });
      const body = JSON.parse(capturedCalls[0].opts.body);
      assert.ok(!('content' in body));
      assert.ok(!('parts' in body));
    });
  });

  describe('ov_sessions_mark_used', () => {
    it('POSTs to /api/v1/sessions/{id}/used with contexts', async () => {
      mockFetch(ok({}));
      await server.tools['ov_sessions_mark_used']({
        id: 'sess-1', contexts: ['ov:///a', 'ov:///b'],
      });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/sessions/sess-1/used'));
      assert.deepEqual(JSON.parse(call.opts.body).contexts, ['ov:///a', 'ov:///b']);
    });

    it('includes skill when provided', async () => {
      mockFetch(ok({}));
      const skill = { id: 'sk1', version: '1.0' };
      await server.tools['ov_sessions_mark_used']({
        id: 'sess-1', contexts: [], skill,
      });
      assert.deepEqual(JSON.parse(capturedCalls[0].opts.body).skill, skill);
    });
  });

  describe('ov_sessions_commit', () => {
    it('POSTs to /api/v1/sessions/{id}/commit', async () => {
      mockFetch(ok({ task_id: 'task-123' }));
      await server.tools['ov_sessions_commit']({ id: 'sess-1' });
      const call = capturedCalls[0];
      assert.equal(call.opts.method, 'POST');
      assert.ok(call.url.endsWith('/api/v1/sessions/sess-1/commit'));
    });

    it('includes wait and timeout when provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_sessions_commit']({ id: 'sess-1', wait: true, timeout: 60 });
      const body = JSON.parse(capturedCalls[0].opts.body);
      assert.equal(body.wait, true);
      assert.equal(body.timeout, 60);
    });

    it('omits wait/timeout when not provided', async () => {
      mockFetch(ok({}));
      await server.tools['ov_sessions_commit']({ id: 'sess-1' });
      const body = JSON.parse(capturedCalls[0].opts.body);
      assert.ok(!('wait' in body));
      assert.ok(!('timeout' in body));
    });
  });

  describe('ov_tasks_get', () => {
    it('GETs /api/v1/tasks/{task_id}', async () => {
      mockFetch(ok({ status: 'complete' }));
      await server.tools['ov_tasks_get']({ task_id: 'task-123' });
      assert.ok(capturedCalls[0].url.endsWith('/api/v1/tasks/task-123'));
    });
  });

  describe('ov_tasks_list', () => {
    it('GETs /api/v1/tasks with no filters', async () => {
      mockFetch(ok([]));
      await server.tools['ov_tasks_list']({});
      assert.ok(capturedCalls[0].url.endsWith('/api/v1/tasks'));
    });

    it('appends filter params when provided', async () => {
      mockFetch(ok([]));
      await server.tools['ov_tasks_list']({
        task_type: 'ingest', status: 'pending', limit: 20,
      });
      const url = capturedCalls[0].url;
      assert.ok(url.includes('task_type=ingest'));
      assert.ok(url.includes('status=pending'));
      assert.ok(url.includes('limit=20'));
    });

    it('omits params not provided', async () => {
      mockFetch(ok([]));
      await server.tools['ov_tasks_list']({ status: 'complete' });
      const url = capturedCalls[0].url;
      assert.ok(!url.includes('task_type='));
      assert.ok(url.includes('status=complete'));
    });
  });
});
