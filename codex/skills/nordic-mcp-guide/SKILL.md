---
name: nordic-mcp Guide
description: Practical Codex guide for installing, connecting to, and using the nordic-mcp OpenViking MCP server, including health checks, resource URIs, and the current ov_* tool surface.
---

# nordic-mcp Guide

Portable Codex skill for installing, connecting to, and using the `nordic-mcp`
OpenViking vector-database MCP server.

## Intent Router

Load this skill when the user wants to:

- Install `nordic-mcp` into Codex from GitHub or a local checkout
- Configure Codex to connect to the running MCP server
- Start the Docker stack and verify the server is healthy
- Store, search, or manage content with the `ov_*` MCP tools and the
  `nordic_*` item CRUD helpers
- Debug common connection, auth, or persistence failures

Related references:

- [references/install.md](references/install.md) — Codex install and MCP setup
- [references/workflow.md](references/workflow.md) — common execution patterns
- [references/examples.md](references/examples.md) — representative tool calls
- [references/pitfalls.md](references/pitfalls.md) — troubleshooting guide

## Quick Start

1. Install this skill into Codex from the repo path
2. Configure `container/.env` and start the Docker stack
3. Add the `nordic-mcp` server to your Codex MCP config using `npx mcp-remote`
4. Restart Codex to pick up new skills and MCP configuration
5. Confirm `ov_health_get` returns `{"status":"ok"}`

For exact commands, see [references/install.md](references/install.md).

## Input Contract

Before calling any write tools, confirm:

- The Docker stack is running and healthy
- Resource URIs use `viking://resources/...` in new workflows
- If you see `ov:///...` in older examples, treat it as a compatibility alias
- The runtime API key has been configured in `container/.env`

Before calling search tools, confirm:

- The target resource subtree exists and contains indexed content
- The query is a natural-language phrase, not just keywords
- `ov_content_abstract` and `ov_content_overview` read generated summary
  artifacts; they do not synthesize summaries on demand
- `ov_resources_create` keeps the public `target` parameter; the wrapper maps
  it to the upstream REST `to` field internally

## Architecture

```text
Codex skill ─→ Codex MCP config
                 │
                 └── npx mcp-remote http://127.0.0.1:1933/mcp
                           │
                     nginx (port 1933)
                     ├── POST /mcp  ─→ Node.js MCP server (port 4050)
                     └── *         ─→ OpenViking REST API (port 1934)
                                       │
                                vikingDB (LevelDB)
                                $HOME/.nordic_mcp/openviking-data
```

OpenViking version: `v0.2.9`
MCP server version: `2.0.0`

## Standard Deliverables

After completing setup, confirm:

- The Docker container is healthy
- `http://127.0.0.1:1933/health` returns `{"status":"ok"}`
- Codex shows the `nordic-mcp` MCP server as connected
- At least one MCP tool call succeeds end-to-end

After completing an ingest workflow, confirm:

- Collection item count increased as expected
- A representative search returns relevant results
- No failed async tasks remain

## Live Tool Surface

The live server exposes `ov_*` tools for the OpenViking REST surface, plus a
small `nordic_*` item CRUD layer and legacy aliases such as `search_by_text`
and `upsert_data`.

Prefer these families during Codex sessions:

- Health and readiness: `ov_health_get`, `ov_ready_get`, `ov_system_status_get`
- Filesystem and resources: `ov_fs_*`, `ov_resources_*`, `ov_pack_*`
- Content and search: `ov_content_*`, `ov_search_*`
- Sessions and tasks: `ov_sessions_*`, `ov_tasks_*`
- Relations and admin: `ov_relations_*`, `ov_admin_*`
- Item CRUD helpers: `nordic_upsert_item`, `nordic_fetch_item`,
  `nordic_delete_item`, `nordic_list_items`

Recommended verification path:

1. `ov_health_get`
2. `ov_system_status_get`
3. `ov_fs_mkdir` with `viking://resources/...`
4. `ov_resources_temp_upload` then `ov_resources_create`
5. `ov_fs_ls` or `nordic_list_items`, depending on whether you ingested files or
   collection items
6. `ov_content_overview` only after ingest or reindex has completed

## Guardrails

- Never delete a collection without explicit user confirmation.
- Check `ov_health_get` before any write sequence.
- Prefer `viking://resources/...` URIs in new workflows.
- OpenAI-compatible local endpoints such as LM Studio are supported for
  embeddings and text generation when the env values match the loaded models.
- The server filters invalid vector scores before returning search results.
- Do not change the embedding model after data has been stored unless you plan to rebuild affected collections.
- Do not commit `container/.env`.

## Verification Checklist

- [ ] Docker stack is healthy
- [ ] `ov_health_get` returns `{"status":"ok"}`
- [ ] Codex skill is installed and available after restart
- [ ] Codex MCP server entry points to `http://127.0.0.1:1933/mcp`
- [ ] At least one MCP tool call succeeds
