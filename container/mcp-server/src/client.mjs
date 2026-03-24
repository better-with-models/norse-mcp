// ── OpenViking MCP — HTTP client facade ────────────────────────────────────────
//
// createClient(config) → { fetch: ovFetch, formPost, buildTenantHeaders }
//
// ovFetch(path, opts?, tenantHeaders?)
//   - Injects Authorization + Content-Type headers
//   - Returns the `result` field from the OpenViking envelope on success
//   - Throws OvError on non-2xx responses
//
// formPost(path, formData, tenantHeaders?)
//   - Multipart upload variant (no Content-Type override — let fetch set boundary)
//   - Same auth injection and error normalisation
//
// buildTenantHeaders({ account_id?, user_id?, agent_id? })
//   - Returns the subset of X-OpenViking-* headers that are non-null

export class OvError extends Error {
  constructor(method, path, status, body) {
    super(`OpenViking ${method} ${path} → ${status}: ${body}`);
    this.name  = 'OvError';
    this.method = method;
    this.path   = path;
    this.status = status;
    this.body   = body;
  }
}

const OV_ALIAS_PREFIX = 'ov:///';
const VIKING_RESOURCES_PREFIX = 'viking://resources';

export function buildTenantHeaders({ account_id, user_id, agent_id } = {}) {
  const h = {};
  if (account_id != null) h['X-OpenViking-Account'] = String(account_id);
  if (user_id    != null) h['X-OpenViking-User']    = String(user_id);
  if (agent_id   != null) h['X-OpenViking-Agent']   = String(agent_id);
  return h;
}

export function normalizeUriAlias(uri) {
  if (typeof uri !== 'string' || !uri.startsWith(OV_ALIAS_PREFIX)) return uri;
  const suffix = uri.slice(OV_ALIAS_PREFIX.length).replace(/^\/+/, '');
  return suffix ? `${VIKING_RESOURCES_PREFIX}/${suffix}` : VIKING_RESOURCES_PREFIX;
}

export function normalizeUriAliases(uris = []) {
  return uris.map((uri) => normalizeUriAlias(uri));
}

export function createClient(config) {
  const { ovBase, ovKey } = config;

  const authHeader = { Authorization: `Bearer ${ovKey}` };

  async function ovFetch(path, opts = {}, tenantHeaders = {}) {
    const method = opts.method ?? 'GET';
    const res = await fetch(`${ovBase}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...tenantHeaders,
        ...(opts.headers ?? {}),
      },
    });
    const text = await res.text();
    if (!res.ok) throw new OvError(method, path, res.status, text);
    try {
      const json = JSON.parse(text);
      // Return the `result` field when present; fall back to full parsed body.
      return json.result !== undefined ? json.result : json;
    } catch {
      return text;
    }
  }

  async function formPost(path, formData, tenantHeaders = {}) {
    const res = await fetch(`${ovBase}${path}`, {
      method: 'POST',
      headers: { ...authHeader, ...tenantHeaders },
      body: formData,
    });
    const text = await res.text();
    if (!res.ok) throw new OvError('POST', path, res.status, text);
    try {
      const json = JSON.parse(text);
      return json.result !== undefined ? json.result : json;
    } catch {
      return text;
    }
  }

  return { fetch: ovFetch, formPost, buildTenantHeaders };
}
