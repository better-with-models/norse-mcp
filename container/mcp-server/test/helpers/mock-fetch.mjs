// ── Test helper: configurable fetch mock ──────────────────────────────────────
//
// Usage:
//   import { mockFetch, capturedCalls, resetMock } from './helpers/mock-fetch.mjs';
//
//   beforeEach(() => mockFetch({ status: 200, body: { status: 'ok', result: { foo: 1 } } }));
//   afterEach(resetMock);
//
//   // After calling code under test:
//   assert.equal(capturedCalls[0].url, 'http://127.0.0.1:1934/api/v1/fs/ls?uri=...');

let _originalFetch;
export let capturedCalls = [];

/**
 * Replace globalThis.fetch with a stub.
 * @param {object|Function} responseOrFactory
 *   If an object: { status?: number, body?: object|string }
 *   If a function: (url, opts) => { status, body } — called per request
 */
export function mockFetch(responseOrFactory) {
  _originalFetch = globalThis.fetch;
  capturedCalls = [];

  globalThis.fetch = async (url, opts = {}) => {
    const spec = typeof responseOrFactory === 'function'
      ? responseOrFactory(url, opts)
      : responseOrFactory;

    const status = spec.status ?? 200;
    const bodyStr = typeof spec.body === 'string'
      ? spec.body
      : JSON.stringify(spec.body ?? {});

    capturedCalls.push({ url, opts, status, body: spec.body });

    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => bodyStr,
      json: async () => JSON.parse(bodyStr),
    };
  };
}

export function resetMock() {
  if (_originalFetch) globalThis.fetch = _originalFetch;
  capturedCalls = [];
}
