# workbench-mcp-sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the revised OpenViking MCP server from `math-student-skills/mathematics-workbench/openviking-mcp/` into `nordic-mcp/container/`, replacing the old collection-based v1 implementation with the filesystem/resource-based v2 implementation.

**Architecture:** The mathematics-workbench contains a complete v2.0.0 rewrite of the MCP server. It uses a new `McpServer` + `register()` pattern, a `createClient()` factory with `OvError` and envelope-unwrapping, `ov_*` tool names against a new REST API surface, a Python config renderer replacing `envsubst`, and a restructured container layout. All of this replaces the current nordic-mcp implementation wholesale.

**Tech Stack:** Node.js ESM, `@modelcontextprotocol/sdk ^1.10.0`, `zod ^3.22.0`, Python 3 (config renderer), Docker, nginx, supervisord.

---

## Source of truth

All new code lives in:
`C:\Users\aaqui\better-with-models\math-student-skills\mathematics-workbench\openviking-mcp\`

Target repo:
`C:\Users\aaqui\better-with-models\nordic-mcp\`

Read source files when you need exact code — do not paraphrase or reconstruct from memory.

---

## What changes and why

### Tool API surface — complete replacement

The old nordic-mcp targeted the OpenViking v1 _collection-based_ REST API
(`/api/v1/collections/{name}/items`, `/api/v1/collections/{name}/search`, etc.) with
`nordic_*` prefixed tool names.

The workbench targets the new _filesystem/resource-based_ REST API
(`/api/v1/fs/ls`, `/api/v1/resources`, `/api/v1/search/find`, etc.) with `ov_*` prefixed
tool names (grouped by sub-family: `ov_fs_*`, `ov_sessions_*`, `ov_admin_*`, etc.).

**New tool inventory — 47 primary + 5 legacy = 52 tools:**

| Module | Tools |
|--------|-------|
| health | `ov_health_get`, `ov_ready_get` |
| system | `ov_system_status_get`, `ov_system_wait` |
| resources | `ov_resources_temp_upload`, `ov_resources_create`, `ov_skills_create` |
| pack | `ov_pack_export`, `ov_pack_import` |
| filesystem | `ov_fs_ls`, `ov_fs_tree`, `ov_fs_stat`, `ov_fs_mkdir`, `ov_fs_delete`, `ov_fs_move` |
| content | `ov_content_read`, `ov_content_abstract`, `ov_content_overview` |
| search | `ov_search_find`, `ov_search_search`, `ov_search_grep`, `ov_search_glob` |
| relations | `ov_relations_get`, `ov_relations_link`, `ov_relations_unlink` |
| sessions | `ov_sessions_create`, `ov_sessions_list`, `ov_sessions_get`, `ov_sessions_delete`, `ov_sessions_add_message`, `ov_sessions_mark_used`, `ov_sessions_commit` |
| tasks | `ov_tasks_get`, `ov_tasks_list` |
| observer | `ov_observer_queue_get`, `ov_observer_vikingdb_get`, `ov_observer_vlm_get`, `ov_observer_system_get`, `ov_debug_health_get` |
| admin | `ov_admin_accounts_create`, `ov_admin_accounts_list`, `ov_admin_accounts_delete`, `ov_admin_users_create`, `ov_admin_users_list`, `ov_admin_users_delete`, `ov_admin_user_role_update`, `ov_admin_user_key_create` |
| compat (legacy) | `search_by_text`, `upsert_data`, `fetch_data`, `list_collection`, `delete_data` |

### Architecture changes

| Aspect | Old nordic-mcp | New (workbench) |
|--------|----------------|-----------------|
| MCP server | `Server` + `ListTools`/`CallTool` handlers | `McpServer` + `server.tool()` registration |
| Tool modules | `src/*.mjs` → export `{*Tools, handle*}` | `src/tools/*.mjs` → export `register(server, client, Config)` |
| HTTP client | 4 exported functions (`ovGet`, `ovPost`, `ovPut`, `ovDelete`) | `createClient(config)` → `{ fetch, formPost, buildTenantHeaders }` + `OvError` class |
| Config | `config.baseUrl`, `config.apiKey`, `config.mcpPort` | `Config.ovBase`, `Config.ovKey`, `Config.mcpPort`, `Config.collPath` |
| Config env vars | `OPENVIKING_BASE_URL`, `MCP_PORT` | `OPENVIKING_INTERNAL_PORT`, `OPENVIKING_MCP_INTERNAL_PORT`, `OPENVIKING_COLLECTION_PATH` |
| Config rendering | `envsubst` (shell substitution) | `render-openviking-config.py` (Python with fallback chains) |
| `ov.conf.template.json` | `${VAR}` placeholders, wrong JSON structure | Real defaults, correct schema (`server.root_api_key`, `storage.workspace`, `log` section, `embedding.dense` nested) |
| nginx | Sites-available snippet | Full `nginx.conf` with upstream keepalive pools, streaming for MCP (300 s, no-buffer) |
| supervisord | `--config /app/ov.conf.json`, env= line for MCP | `--host 127.0.0.1 --port %(ENV_*)s --config /app/data/ov.conf`, pidfile, startretries/startsecs |
| Dockerfile | Single-stage, `/app/mcp-server/`, nginx sites-available | `syntax=docker/dockerfile:1.9`, `/app/openviking-mcp/`, scripts at `/bootstrap/`, ENV for internal ports |
| `.env.example` | `NORDIC_MCP_DATA`, single `OPENAI_API_KEY` for all | `OPENVIKING_DATA_DIR`, separate `OPENVIKING_EMBED_*` and `OPENVIKING_VLM_*` vars |
| docker-compose | Old env var names | New env var names, 60 s health check start_period |
| Tests | None | Full suite: `test/` with `helpers/mock-fetch.mjs` + module tests |

---

## File map

### Files to CREATE

```
container/scripts/render-openviking-config.py
container/mcp-server/src/tools/health.mjs
container/mcp-server/src/tools/system.mjs
container/mcp-server/src/tools/resources.mjs
container/mcp-server/src/tools/pack.mjs
container/mcp-server/src/tools/filesystem.mjs
container/mcp-server/src/tools/content.mjs
container/mcp-server/src/tools/search.mjs
container/mcp-server/src/tools/relations.mjs
container/mcp-server/src/tools/sessions.mjs
container/mcp-server/src/tools/tasks.mjs
container/mcp-server/src/tools/observer.mjs
container/mcp-server/src/tools/admin.mjs
container/mcp-server/src/tools/compat.mjs
container/mcp-server/test/helpers/mock-fetch.mjs
container/mcp-server/test/client.test.mjs
container/mcp-server/test/system.test.mjs
container/mcp-server/test/resources.test.mjs
container/mcp-server/test/search.test.mjs
container/mcp-server/test/sessions.test.mjs
container/mcp-server/test/relations.test.mjs
container/mcp-server/test/filesystem.test.mjs
container/mcp-server/test/compat.test.mjs
container/mcp-server/test/admin.test.mjs
```

### Files to MODIFY

```
container/Dockerfile
container/docker-compose.yml
container/.env.example
container/openviking/ov.conf.template.json
container/mcp-server/server.mjs
container/mcp-server/src/config.mjs
container/mcp-server/src/client.mjs
container/mcp-server/nginx.conf
container/mcp-server/supervisord.conf
container/mcp-server/start.sh
container/mcp-server/package.json
docs/mcp-coverage-matrix.md
AGENTS.md
CHANGELOG.md
Skills/nordic-mcp-guide/SKILL.md
```

### Files to DELETE (old tool modules superseded by src/tools/)

```
container/mcp-server/src/health.mjs
container/mcp-server/src/system.mjs
container/mcp-server/src/resources.mjs
container/mcp-server/src/skills.mjs
container/mcp-server/src/pack.mjs
container/mcp-server/src/filesystem.mjs
container/mcp-server/src/content.mjs
container/mcp-server/src/search.mjs
container/mcp-server/src/relations.mjs
container/mcp-server/src/sessions.mjs
container/mcp-server/src/tasks.mjs
container/mcp-server/src/observer.mjs
container/mcp-server/src/admin.mjs
container/mcp-server/src/compat.mjs
```

---

## Task 1 — Core MCP infrastructure: server.mjs, config.mjs, client.mjs, package.json

**Files:**
- Modify: `container/mcp-server/server.mjs`
- Modify: `container/mcp-server/src/config.mjs`
- Modify: `container/mcp-server/src/client.mjs`
- Modify: `container/mcp-server/package.json`

**Context:** The server currently uses `Server` + `ListToolsRequestSchema`/`CallToolRequestSchema`
handlers with a manual dispatch table. The new pattern uses `McpServer` with tools registered
via `server.tool()` calls inside each module's `register()` function.

- [ ] **Step 1: Read current files**

  Read the three current files to understand what's being replaced:
  - `container/mcp-server/server.mjs`
  - `container/mcp-server/src/config.mjs`
  - `container/mcp-server/src/client.mjs`

  Read the source-of-truth files from mathematics-workbench:
  - `math-student-skills/mathematics-workbench/openviking-mcp/mcp-server/server.mjs`
  - `math-student-skills/mathematics-workbench/openviking-mcp/mcp-server/src/config.mjs`
  - `math-student-skills/mathematics-workbench/openviking-mcp/mcp-server/src/client.mjs`
  - `math-student-skills/mathematics-workbench/openviking-mcp/mcp-server/package.json`

- [ ] **Step 2: Rewrite `container/mcp-server/src/config.mjs`**

  Copy from workbench verbatim — only change is frozen `Config` export name is already the same.
  New content:
  ```js
  // ── OpenViking MCP — configuration ─────────────────────────────────────────
  // Resolved once from environment variables at startup.

  export const Config = Object.freeze({
    ovBase:   `http://127.0.0.1:${process.env.OPENVIKING_INTERNAL_PORT ?? '1934'}`,
    ovKey:    process.env.OPENVIKING_ROOT_API_KEY ?? '',
    mcpPort:  parseInt(process.env.OPENVIKING_MCP_INTERNAL_PORT ?? '4050', 10),
    collPath: process.env.OPENVIKING_COLLECTION_PATH ?? '/',
  });
  ```

- [ ] **Step 3: Rewrite `container/mcp-server/src/client.mjs`**

  Copy from workbench exactly — includes `OvError`, `buildTenantHeaders`, `createClient`.

- [ ] **Step 4: Rewrite `container/mcp-server/server.mjs`**

  Copy from workbench — change server name from `'openviking-mcp'` to `'nordic-mcp'`.
  Import paths change from `'./src/tools/health.mjs'` etc. (already correct relative paths).

- [ ] **Step 5: Update `container/mcp-server/package.json`**

  - Rename `"name"` to `"openviking-mcp-server"` (matches workbench; the Nordic branding is in the server name string, not here)
  - Add test script: `"test": "node --test 'test/**/*.test.mjs'"`

- [ ] **Step 6: Verify the files are syntactically correct**

  ```bash
  node --check container/mcp-server/server.mjs
  node --check container/mcp-server/src/config.mjs
  node --check container/mcp-server/src/client.mjs
  ```

  Expected: no output (no errors).

- [ ] **Step 7: Commit**

  ```bash
  git -C "C:/Users/aaqui/better-with-models/nordic-mcp" add container/mcp-server/server.mjs container/mcp-server/src/config.mjs container/mcp-server/src/client.mjs container/mcp-server/package.json
  git -C "C:/Users/aaqui/better-with-models/nordic-mcp" commit -m "refactor(mcp): replace Server+dispatch with McpServer+register, upgrade client to createClient factory"
  ```

---

## Task 2 — Tool modules: create src/tools/, port all 13 modules, delete old src/ files

**Files:**
- Create: `container/mcp-server/src/tools/` (13 new modules + compat)
- Delete: `container/mcp-server/src/health.mjs` through `src/compat.mjs` (14 old files)

**Context:** Each old module exported `{*Tools, handle*}`. The new pattern is a single
`export function register(server, client, Config)` that calls `server.tool()` for each tool
in the family. Tool names change from `nordic_*` to `ov_*` and the REST API endpoints are
completely different.

Read every source file from `math-student-skills/mathematics-workbench/openviking-mcp/mcp-server/src/tools/`
before writing. Copy them verbatim — these are the exact implementations to use.

- [ ] **Step 1: Read all workbench tool modules**

  Read each of the 13 files under:
  `math-student-skills/mathematics-workbench/openviking-mcp/mcp-server/src/tools/`
  - `health.mjs`, `system.mjs`, `resources.mjs`, `pack.mjs`, `filesystem.mjs`,
    `content.mjs`, `search.mjs`, `relations.mjs`, `sessions.mjs`, `tasks.mjs`,
    `observer.mjs`, `admin.mjs`, `compat.mjs`

- [ ] **Step 2: Create `container/mcp-server/src/tools/` and write all 13 modules**

  Write each file, copying from the workbench source exactly. No adaptations needed —
  the only reference to project identity is in `server.mjs` (server name), not the tool modules.

- [ ] **Step 3: Verify syntax of all 13 new modules**

  ```bash
  for f in container/mcp-server/src/tools/*.mjs; do node --check "$f"; done
  ```

  Expected: no output.

- [ ] **Step 4: Delete the old src/ flat tool modules**

  ```bash
  rm container/mcp-server/src/health.mjs container/mcp-server/src/system.mjs \
     container/mcp-server/src/resources.mjs container/mcp-server/src/skills.mjs \
     container/mcp-server/src/pack.mjs container/mcp-server/src/filesystem.mjs \
     container/mcp-server/src/content.mjs container/mcp-server/src/search.mjs \
     container/mcp-server/src/relations.mjs container/mcp-server/src/sessions.mjs \
     container/mcp-server/src/tasks.mjs container/mcp-server/src/observer.mjs \
     container/mcp-server/src/admin.mjs container/mcp-server/src/compat.mjs
  ```

- [ ] **Step 5: Commit**

  ```bash
  git -C "C:/Users/aaqui/better-with-models/nordic-mcp" add container/mcp-server/src/
  git -C "C:/Users/aaqui/better-with-models/nordic-mcp" commit -m "refactor(tools): replace nordic_* collection API with ov_* filesystem API across all 13 tool modules"
  ```

---

## Task 3 — Container infrastructure: Dockerfile, nginx, supervisord, start.sh, config renderer, .env

**Files:**
- Modify: `container/Dockerfile`
- Modify: `container/mcp-server/nginx.conf`
- Modify: `container/mcp-server/supervisord.conf`
- Modify: `container/mcp-server/start.sh`
- Create: `container/scripts/render-openviking-config.py`
- Modify: `container/openviking/ov.conf.template.json`
- Modify: `container/docker-compose.yml`
- Modify: `container/.env.example`

**Context:** The old stack uses `envsubst` for config rendering, sites-available nginx,
and supervisord that pins the config path incorrectly. The new stack uses a Python renderer
with structured env-var fallbacks, a full `nginx.conf` with upstream pools and streaming
optimisation, and a supervisord that reads `%(ENV_OPENVIKING_INTERNAL_PORT)s`.

Read each source file from mathematics-workbench before writing:
- `openviking-mcp/nginx.conf`
- `openviking-mcp/supervisord.conf`
- `openviking-mcp/start.sh`
- `scripts/render-openviking-config.py`
- `openviking/ov.conf.template.json`
- `Dockerfile` (openviking-mcp target section only)
- `.env.example`

- [ ] **Step 1: Read source files**

  Read the 7 files listed above from the workbench.

- [ ] **Step 2: Write `container/mcp-server/nginx.conf`**

  Replace the nginx snippet with the full workbench `nginx.conf`. This adds proper
  `worker_processes`, `events`, `http` context, upstream keepalive pools, and streaming
  optimisation for `/mcp` (no buffering, 300 s timeouts, `X-Accel-Buffering no`,
  `chunked_transfer_encoding on`), plus `/tmp` pid and temp paths for non-root operation.

- [ ] **Step 3: Write `container/mcp-server/supervisord.conf`**

  Replace with workbench version. Key changes:
  - Add `pidfile=/tmp/supervisord.pid`
  - openviking-server: `--host 127.0.0.1 --port %(ENV_OPENVIKING_INTERNAL_PORT)s --config /app/data/ov.conf`
  - openviking-mcp: `node /app/openviking-mcp/server.mjs` (new path)
  - Remove the old `environment=` line (env vars are now inherited from Docker)
  - Add `startretries=5`, `startsecs=5` for openviking-server; `startretries=5`, `startsecs=3` for mcp

- [ ] **Step 4: Write `container/scripts/render-openviking-config.py`**

  Create the scripts directory and write the Python config renderer from the workbench
  (`scripts/render-openviking-config.py`). This replaces `envsubst`.

  The script reads `OPENVIKING_TEMPLATE_PATH` (default: `/bootstrap/ov.conf.template.json`)
  and writes to `OPENVIKING_CONFIG_OUTPUT` (default: `/app/data/ov.conf`).
  It merges `OPENVIKING_EMBED_*`, `OPENVIKING_VLM_*`, server, storage, and log sections
  with fallback chains (e.g. `OPENVIKING_EMBED_API_KEY` falls back to `OPENAI_API_KEY`).

- [ ] **Step 5: Write `container/mcp-server/start.sh`**

  Replace the `envsubst` call with `python /bootstrap/scripts/render-openviking-config.py`.
  Add `mkdir -p /tmp/nginx_client_body /tmp/nginx_proxy` for non-root nginx operation.
  Update supervisord config path to match new layout.

  ```sh
  #!/bin/sh
  set -e
  python /bootstrap/scripts/render-openviking-config.py
  mkdir -p /tmp/nginx_client_body /tmp/nginx_proxy
  exec /usr/bin/supervisord -c /app/openviking-mcp/supervisord.conf
  ```

- [ ] **Step 6: Write `container/openviking/ov.conf.template.json`**

  Replace with the workbench version — has real defaults instead of `${VAR}` placeholders,
  correct structure (`server.root_api_key`, `storage.workspace`, `log.level`/`log.output`,
  `embedding.dense` nested block with `api_base`, `api_key`, `provider`, `dimension`, `model`,
  `embedding.max_concurrent`, `vlm` section).

- [ ] **Step 7: Rewrite `container/Dockerfile`**

  Replace with the `openviking-mcp` target from the workbench Dockerfile (lines 78–108).
  Adapt for the nordic-mcp single-stage layout (not multi-stage):

  ```dockerfile
  # syntax=docker/dockerfile:1.9
  ARG OPENVIKING_VERSION=v0.2.9

  FROM ghcr.io/volcengine/openviking:${OPENVIKING_VERSION}

  ENV DEBIAN_FRONTEND=noninteractive
  RUN apt-get update && apt-get install -y --no-install-recommends \
          nginx nodejs npm supervisor curl python3 \
      && rm -rf /var/lib/apt/lists/*

  # nginx config, supervisord config, entrypoint
  COPY mcp-server/nginx.conf           /etc/nginx/nginx.conf
  COPY mcp-server/supervisord.conf     /app/openviking-mcp/supervisord.conf
  COPY mcp-server/start.sh             /usr/local/bin/start-openviking-mcp.sh

  # Python config renderer + OpenViking config template
  COPY scripts/render-openviking-config.py /bootstrap/scripts/render-openviking-config.py
  COPY openviking/ov.conf.template.json    /bootstrap/ov.conf.template.json

  # Node.js MCP server — install deps at build time
  COPY mcp-server/ /app/openviking-mcp/
  RUN cd /app/openviking-mcp && npm ci --omit=dev

  RUN chmod +x /usr/local/bin/start-openviking-mcp.sh \
      && mkdir -p /tmp/nginx_client_body /tmp/nginx_proxy /app/data

  ENV OPENVIKING_INTERNAL_PORT=1934
  ENV OPENVIKING_MCP_INTERNAL_PORT=4050

  EXPOSE 1933

  ENTRYPOINT ["/usr/local/bin/start-openviking-mcp.sh"]
  ```

  Note: add `python3` to apt-get list (not in workbench because it's a Python base image there;
  the OpenViking base image is Debian 13 and does not include python3 by default).

- [ ] **Step 8: Rewrite `container/.env.example`**

  Replace with workbench structure — remove Jupyter sections, add:
  - `OPENVIKING_DATA_DIR` (replaces `NORDIC_MCP_DATA`)
  - `OPENVIKING_LOG_LEVEL`, `OPENVIKING_LOG_OUTPUT`
  - Separate `OPENVIKING_EMBED_API_BASE`, `OPENVIKING_EMBED_API_KEY`, `OPENVIKING_EMBED_PROVIDER`, `OPENVIKING_EMBED_DIMENSION`, `OPENVIKING_EMBED_MODEL`
  - Separate `OPENVIKING_VLM_API_BASE`, `OPENVIKING_VLM_API_KEY`, `OPENVIKING_VLM_PROVIDER`, `OPENVIKING_VLM_MODEL`, `OPENVIKING_VLM_MAX_CONCURRENT`
  - `OPENVIKING_VERSION=v0.2.9`
  - `OPENVIKING_INTERNAL_PORT=1934`
  - `OPENVIKING_COLLECTION_PATH=/`
  - `OPENVIKING_INDEX_NAME=`

- [ ] **Step 9: Update `container/docker-compose.yml`**

  Update environment section to use new variable names:
  - Remove: `OPENVIKING_EMBEDDING_MODEL`, `OPENVIKING_EMBEDDING_DIM`, `OPENVIKING_VLM_MODEL`, `OPENVIKING_DATA`
  - Add all `OPENVIKING_EMBED_*` and `OPENVIKING_VLM_*` vars
  - Update volume mount: `${OPENVIKING_DATA_DIR:-~/.nordic_mcp/openviking-data}:/app/data`
  - Update health check `start_period: 60s`
  - Pass through: `OPENVIKING_INTERNAL_PORT`, `OPENVIKING_MCP_INTERNAL_PORT`, `OPENVIKING_COLLECTION_PATH`, `OPENVIKING_LOG_LEVEL`, `OPENVIKING_LOG_OUTPUT`

- [ ] **Step 10: Commit**

  ```bash
  git -C "C:/Users/aaqui/better-with-models/nordic-mcp" add container/
  git -C "C:/Users/aaqui/better-with-models/nordic-mcp" commit -m "refactor(container): Python config renderer, upstream nginx, supervisord paths, updated env vars"
  ```

---

## Task 4 — Test suite

**Files:**
- Create: `container/mcp-server/test/helpers/mock-fetch.mjs`
- Create: `container/mcp-server/test/client.test.mjs`
- Create: `container/mcp-server/test/system.test.mjs`
- Create: `container/mcp-server/test/resources.test.mjs`
- Create: `container/mcp-server/test/search.test.mjs`
- Create: `container/mcp-server/test/sessions.test.mjs`
- Create: `container/mcp-server/test/relations.test.mjs`
- Create: `container/mcp-server/test/filesystem.test.mjs`
- Create: `container/mcp-server/test/compat.test.mjs`
- Create: `container/mcp-server/test/admin.test.mjs`

**Context:** The workbench has a complete test suite using `node:test` and `node:assert/strict`.
Tests use a configurable `mockFetch` helper that stubs `globalThis.fetch` and captures calls.
Each tool-module test file creates a `makeMockServer()` stub, calls `register(server, client, cfg)`,
and then invokes tools directly to verify HTTP calls.

Read every test file from the workbench before writing. Copy them verbatim.

Test files in workbench at:
`math-student-skills/mathematics-workbench/openviking-mcp/mcp-server/test/`

- [ ] **Step 1: Read all workbench test files**

  Read: `helpers/mock-fetch.mjs`, `client.test.mjs`, `system.test.mjs`, `resources.test.mjs`,
  `search.test.mjs`, `sessions.test.mjs`, `relations.test.mjs`, `filesystem.test.mjs`,
  `compat.test.mjs`, `admin.test.mjs`

- [ ] **Step 2: Write all test files to `container/mcp-server/test/`**

  Copy each file verbatim from the workbench. Import paths (`../src/client.mjs`,
  `../src/tools/search.mjs`, etc.) already match the nordic-mcp layout.

- [ ] **Step 3: Run the tests**

  ```bash
  cd "C:/Users/aaqui/better-with-models/nordic-mcp/container/mcp-server" && node --test 'test/**/*.test.mjs'
  ```

  Expected: all tests pass, output ends with summary showing 0 failures.

  If tests fail — fix the issue before proceeding. Common causes:
  - Import path mismatch → check `src/tools/` exists and file names match
  - Missing `formPost` on client → verify `client.mjs` was updated in Task 1
  - Config field name mismatch → verify `config.mjs` uses `ovBase`/`ovKey`/`collPath`

- [ ] **Step 4: Commit**

  ```bash
  git -C "C:/Users/aaqui/better-with-models/nordic-mcp" add container/mcp-server/test/
  git -C "C:/Users/aaqui/better-with-models/nordic-mcp" commit -m "test(mcp): add node:test suite for client, tools, and compat"
  ```

---

## Task 5 — Documentation: coverage matrix, AGENTS.md, SKILL.md, CHANGELOG.md

**Files:**
- Modify: `docs/mcp-coverage-matrix.md`
- Modify: `AGENTS.md`
- Modify: `CHANGELOG.md`
- Modify: `Skills/nordic-mcp-guide/SKILL.md`

**Context:** All documentation currently references 40 `nordic_*` tools mapped to the old
collection-based API. These must be updated to reflect the 47 `ov_*` tools (+ 5 legacy),
the new REST endpoint surface, and the new env var names.

- [ ] **Step 1: Rewrite `docs/mcp-coverage-matrix.md`**

  Replace the tool table with the new 47-tool inventory.
  Use this exact table (REST endpoints taken from the tool module sources):

  ```markdown
  # MCP Coverage Matrix — nordic-mcp v0.2.0

  47 primary MCP tools mapped to OpenViking REST API endpoints.

  | # | MCP Tool | Method | REST Endpoint |
  |---|----------|--------|---------------|
  | 1 | `ov_health_get` | GET | `/health` |
  | 2 | `ov_ready_get` | GET | `/ready` |
  | 3 | `ov_system_status_get` | GET | `/api/v1/system/status` |
  | 4 | `ov_system_wait` | POST | `/api/v1/system/wait` |
  | 5 | `ov_resources_temp_upload` | POST | `/api/v1/resources/temp_upload` |
  | 6 | `ov_resources_create` | POST | `/api/v1/resources` |
  | 7 | `ov_skills_create` | POST | `/api/v1/skills` |
  | 8 | `ov_pack_export` | POST | `/api/v1/pack/export` |
  | 9 | `ov_pack_import` | POST | `/api/v1/pack/import` |
  | 10 | `ov_fs_ls` | GET | `/api/v1/fs/ls` |
  | 11 | `ov_fs_tree` | GET | `/api/v1/fs/tree` |
  | 12 | `ov_fs_stat` | GET | `/api/v1/fs/stat` |
  | 13 | `ov_fs_mkdir` | POST | `/api/v1/fs/mkdir` |
  | 14 | `ov_fs_delete` | DELETE | `/api/v1/fs` |
  | 15 | `ov_fs_move` | POST | `/api/v1/fs/mv` |
  | 16 | `ov_content_read` | GET | `/api/v1/content/read` |
  | 17 | `ov_content_abstract` | GET | `/api/v1/content/abstract` |
  | 18 | `ov_content_overview` | GET | `/api/v1/content/overview` |
  | 19 | `ov_search_find` | POST | `/api/v1/search/find` |
  | 20 | `ov_search_search` | POST | `/api/v1/search/search` |
  | 21 | `ov_search_grep` | POST | `/api/v1/search/grep` |
  | 22 | `ov_search_glob` | POST | `/api/v1/search/glob` |
  | 23 | `ov_relations_get` | GET | `/api/v1/relations` |
  | 24 | `ov_relations_link` | POST | `/api/v1/relations/link` |
  | 25 | `ov_relations_unlink` | DELETE | `/api/v1/relations/link` |
  | 26 | `ov_sessions_create` | POST | `/api/v1/sessions` |
  | 27 | `ov_sessions_list` | GET | `/api/v1/sessions` |
  | 28 | `ov_sessions_get` | GET | `/api/v1/sessions/{id}` |
  | 29 | `ov_sessions_delete` | DELETE | `/api/v1/sessions/{id}` |
  | 30 | `ov_sessions_add_message` | POST | `/api/v1/sessions/{id}/messages` |
  | 31 | `ov_sessions_mark_used` | POST | `/api/v1/sessions/{id}/used` |
  | 32 | `ov_sessions_commit` | POST | `/api/v1/sessions/{id}/commit` |
  | 33 | `ov_tasks_get` | GET | `/api/v1/tasks/{id}` |
  | 34 | `ov_tasks_list` | GET | `/api/v1/tasks` |
  | 35 | `ov_observer_queue_get` | GET | `/api/v1/observer/queue` |
  | 36 | `ov_observer_vikingdb_get` | GET | `/api/v1/observer/vikingdb` |
  | 37 | `ov_observer_vlm_get` | GET | `/api/v1/observer/vlm` |
  | 38 | `ov_observer_system_get` | GET | `/api/v1/observer/system` |
  | 39 | `ov_debug_health_get` | GET | `/api/v1/debug/health` |
  | 40 | `ov_admin_accounts_create` | POST | `/api/v1/admin/accounts` |
  | 41 | `ov_admin_accounts_list` | GET | `/api/v1/admin/accounts` |
  | 42 | `ov_admin_accounts_delete` | DELETE | `/api/v1/admin/accounts/{id}` |
  | 43 | `ov_admin_users_create` | POST | `/api/v1/admin/accounts/{id}/users` |
  | 44 | `ov_admin_users_list` | GET | `/api/v1/admin/accounts/{id}/users` |
  | 45 | `ov_admin_users_delete` | DELETE | `/api/v1/admin/accounts/{id}/users/{uid}` |
  | 46 | `ov_admin_user_role_update` | PUT | `/api/v1/admin/accounts/{id}/users/{uid}/role` |
  | 47 | `ov_admin_user_key_create` | POST | `/api/v1/admin/accounts/{id}/users/{uid}/key` |
  ```

  Then a legacy aliases table:

  ```markdown
  ## Legacy aliases (5 tools)

  | Alias | Maps to / behaviour |
  |-------|---------------------|
  | `search_by_text` | `ov_search_find` via `/api/v1/search/find` |
  | `upsert_data` | 3-step ingest: `ov_resources_temp_upload` → `ov_resources_create` → `ov_fs_move` |
  | `fetch_data` | `ov_fs_ls` + `ov_content_read` via `/api/v1/content/read` |
  | `list_collection` | `ov_fs_ls` via `/api/v1/fs/ls` |
  | `delete_data` | `ov_fs_delete` via `DELETE /api/v1/fs` |

  **Total exposed tools: 47 primary + 5 aliases = 52**
  ```

  Update the authentication and base URL sections to remove the old `OPENVIKING_ROOT_API_KEY`
  injection note (it's still injected via env, just clarify the config renderer handles it).

- [ ] **Step 2: Update `AGENTS.md` tool count and naming**

  Find and update the "Tool count" row in the documentation invariants table:
  - Change `40 tools` → `47 tools (+ 5 legacy = 52)`
  - Change tool naming description from `nordic_*` to `ov_*`

- [ ] **Step 3: Update `CHANGELOG.md` — add v0.2.0 entry**

  Add at the top of the changelog (before v0.1.0):

  ```markdown
  ## [0.2.0] — 2026-03-22

  ### Changed
  - **Breaking:** All MCP tool names changed from `nordic_*` prefix to `ov_*` prefix with
    sub-family grouping (`ov_fs_*`, `ov_sessions_*`, `ov_admin_*`, etc.)
  - **Breaking:** REST API surface changed from collection-based (`/api/v1/collections/…`)
    to filesystem/resource-based (`/api/v1/fs/…`, `/api/v1/resources`, `/api/v1/search/…`)
  - MCP server architecture replaced with `McpServer` + `register()` pattern
  - HTTP client replaced with `createClient()` factory (`OvError`, envelope-unwrapping,
    multi-tenancy `X-OpenViking-*` headers, `formPost` for multipart uploads)
  - Config rendered by Python script (`render-openviking-config.py`) instead of `envsubst`
  - `ov.conf.template.json` restructured with real defaults and `embedding.dense` schema
  - nginx upgraded to full config with upstream pools and MCP streaming optimisation
  - supervisord updated with `startretries`, `startsecs`, `pidfile`
  - `.env.example` split `OPENAI_API_KEY` into separate `OPENVIKING_EMBED_API_KEY` and
    `OPENVIKING_VLM_API_KEY` with `OPENAI_API_KEY` as fallback

  ### Added
  - `ov_ready_get` — readiness check beyond basic health
  - `ov_fs_*` family (ls, tree, stat, mkdir, delete, move)
  - `ov_content_*` family (read, abstract, overview)
  - `ov_search_grep` and `ov_search_glob`
  - `ov_sessions_add_message`, `ov_sessions_mark_used`, `ov_sessions_commit`
  - `ov_relations_link` / `ov_relations_unlink`
  - `ov_pack_export` / `ov_pack_import`
  - `ov_admin_*` account and user management (8 tools)
  - `ov_observer_*` metrics family (5 tools) + `ov_debug_health_get`
  - `ov_skills_create`
  - Full test suite (`node:test`, `test/**/*.test.mjs`)
  - `OPENVIKING_COLLECTION_PATH` and `OPENVIKING_INDEX_NAME` env vars

  ### Backward compatibility
  - The 5 legacy aliases (`search_by_text`, `upsert_data`, `fetch_data`, `list_collection`,
    `delete_data`) remain registered but are reimplemented against the new API endpoints
  ```

- [ ] **Step 4: Update `Skills/nordic-mcp-guide/SKILL.md`**

  Find all references to `nordic_*` tool names and the old API endpoints and update them to
  the new `ov_*` names and filesystem-based endpoints. Also update the tool count.

- [ ] **Step 5: Run markdownlint**

  ```bash
  cd "C:/Users/aaqui/better-with-models/nordic-mcp" && npm run lint
  ```

  Fix any lint errors before committing.

- [ ] **Step 6: Commit**

  ```bash
  git -C "C:/Users/aaqui/better-with-models/nordic-mcp" add docs/ AGENTS.md CHANGELOG.md Skills/
  git -C "C:/Users/aaqui/better-with-models/nordic-mcp" commit -m "docs: update coverage matrix to 47 ov_* tools, CHANGELOG v0.2.0, SKILL.md and AGENTS.md sync"
  ```

---

## Verification

After all tasks are complete, run the following checks:

```bash
# 1. All Node tests pass
cd "C:/Users/aaqui/better-with-models/nordic-mcp/container/mcp-server"
node --test 'test/**/*.test.mjs'

# 2. Markdownlint passes
cd "C:/Users/aaqui/better-with-models/nordic-mcp"
npm run lint

# 3. Syntax check on all src files
node --check container/mcp-server/server.mjs
for f in container/mcp-server/src/config.mjs container/mcp-server/src/client.mjs container/mcp-server/src/tools/*.mjs; do
  node --check "$f"
done

# 4. Docker build (if Docker is running)
cd container
cp .env.example .env
# Edit .env: set OPENVIKING_ROOT_API_KEY=test-key OPENAI_API_KEY=unused
docker compose build
docker compose up -d
sleep 15
curl http://127.0.0.1:1933/health
# Expected: {"status":"ok"} or {"status":"ready"}
docker compose down
```
