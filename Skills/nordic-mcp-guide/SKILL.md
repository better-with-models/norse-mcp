---
name: nordic-mcp Guide
description: Complete reference for using the nordic-mcp OpenViking vector-database MCP server — REST API patterns, 40-tool MCP reference, session lifecycle, and guardrails.
---

# nordic-mcp Guide

Complete reference for storing, searching, and managing content via the
nordic-mcp OpenViking vector-database MCP server.

## Intent Router

Load this skill when the user wants to:

- Store, ingest, or embed content → [Workflow: Ingest](#ingest-pattern)
- Search, retrieve, or look up stored content → [Workflow: Search](#search-pattern)
- Manage collections (create, list, delete) → [MCP tool reference — Resources](#3-resources--collections-4-tools)
- Perform bulk ingestion → [Workflow: Pack ingest](#pack-ingest-pattern)
- Start, stop, or configure the stack → [docs/getting-started.md](../../docs/getting-started.md)
- Debug connection or auth failures → [references/pitfalls.md](references/pitfalls.md)
- Understand all available tools → [MCP tool reference](#mcp-tool-reference--56-tools-15-families)

Related docs:

- [docs/mcp-coverage-matrix.md](../../docs/mcp-coverage-matrix.md) — exhaustive REST endpoint map
- [docs/getting-started.md](../../docs/getting-started.md) — first-use walkthrough
- [references/workflow.md](references/workflow.md) — execution patterns
- [references/examples.md](references/examples.md) — representative tool call examples
- [references/pitfalls.md](references/pitfalls.md) — common mistakes and diagnostics

## Quick Start

1. Confirm the stack is healthy: `ov_health_get` → `{"status":"ok"}`
2. Create or confirm a collection: `ov_fs_mkdir` with `uri: "viking://resources/my-collection"`
3. Store content: `ov_resources_create` with `wait:true` (long text/files) or `nordic_upsert_item` (pre-chunked items)
4. Search: `ov_search_search` with a natural-language `query`
5. Retrieve a full item: `nordic_fetch_item` with the `id` from search results

## Input Contract

Before calling any write tools, confirm:

- Stack is running and healthy (`ov_health_get` returns `{"status":"ok"}`)
- Collection directory exists (`ov_fs_mkdir` is idempotent — safe to call on existing paths)
- `id` values are unique within the collection
- `text` content is UTF-8 string (not binary)
- API key available (MCP server handles auth internally; confirm `.env` is set)
- When using the root API key, pass `account_id` and `user_id` params on data-plane calls

Before calling search tools, confirm:

- Collection exists and has items (`ov_fs_stat` shows `item_count > 0`)
- Query is a natural-language phrase, not a keyword list

## Workflow

### Ingest pattern

```text
1. ov_health_get                → verify stack is up
2. ov_fs_mkdir                  → idempotent — OK to call on existing collection
3. ov_resources_create          → for documents/files (set wait:true for sync)
   OR nordic_upsert_item        → for pre-chunked or short items
4. ov_fs_stat                   → verify item count increased
```

### Search pattern

```text
1. ov_search_search             → semantic vector search (default choice)
   OR ov_search_find            → when keyword/filter precision matters
2. nordic_fetch_item            → retrieve full content for top result(s)
3. ov_relations_get             → optional: follow graph edges to related items
```

### Pack ingest pattern

For bulk ingestion (> 100 items or large documents):

```text
1. ov_pack_import               → upload items in batch (triggers async task)
2. ov_tasks_get                 → poll until status = "completed"
3. ov_fs_stat                   → verify item count
4. ov_search_search             → spot-check results
```

## Architecture

```text
Claude (via MCP) ─→ npx mcp-remote http://127.0.0.1:1933/mcp
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

After completing an ingest workflow, confirm:

- Collection item count reflects all ingested content (`ov_fs_stat`)
- At least one representative search returns relevant results (`ov_search_search`)
- No failed async tasks (`ov_tasks_list` with `status: "failed"` returns empty)

After completing a search workflow, deliver:

- Ranked list of matching items with IDs and relevance scores
- Full text of the top result(s) via `nordic_fetch_item`
- Related items via `ov_relations_get` when graph context was requested

## MCP Tool Reference — 56 tools, 15 families

### 1. Health (2 tools)

| Tool | Description |
|------|-------------|
| `ov_health_get` | Verify server is reachable and healthy |
| `ov_ready_get` | Readiness probe — checks all subsystems |

### 2. System (2 tools)

| Tool | Description |
|------|-------------|
| `ov_system_status_get` | Version, capabilities, initialized state |
| `ov_system_wait` | Block until system is ready |

### 3. Resources (2 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `ov_resources_temp_upload` | `content`, `filename` | Upload temp file for processing |
| `ov_resources_create` | `path`, `target`, `wait`, `timeout` | Ingest file/URL into collection; wrapper maps `target` to upstream `to` |

### 4. Skills (1 tool)

| Tool | Key params | Description |
|------|-----------|-------------|
| `ov_skills_create` | `name`, `content` | Create a reusable skill entry |

### 5. Items (4 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_upsert_item` | `collection`, `items[]`, `account_id`, `user_id` | Insert or update items |
| `nordic_fetch_item` | `collection`, `id` | Retrieve item by ID |
| `nordic_delete_item` | `collection`, `id` | Delete item by ID |
| `nordic_list_items` | `collection`, `limit`, `offset` | Paginated listing |

### 6. Pack — bulk ingestion (2 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `ov_pack_export` | `uri` | Export a pack bundle |
| `ov_pack_import` | `path`, `target`, `wait` | Bulk-import pack (async) |

### 7. Filesystem (6 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `ov_fs_ls` | `uri` | List directory / collection contents |
| `ov_fs_tree` | `uri` | Tree view of a collection |
| `ov_fs_stat` | `uri` | Metadata and item count for a path |
| `ov_fs_mkdir` | `uri` | Create collection directory (idempotent) |
| `ov_fs_delete` | `uri` | Delete entry — irreversible |
| `ov_fs_move` | `source`, `target` | Move or rename |

### 8. Content (3 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `ov_content_read` | `uri` | Read stored content |
| `ov_content_abstract` | `uri` | Read the generated `.abstract.md` summary for a directory |
| `ov_content_overview` | `uri` | Read the generated `.overview.md` summary for a directory |

### 9. Search (4 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `ov_search_search` | `collection_path`, `query`, `top_k` | Semantic vector search |
| `ov_search_find` | `collection_path`, `query`, `filter` | Keyword/filter search |
| `ov_search_grep` | `collection_path`, `pattern` | Text grep across items |
| `ov_search_glob` | `collection_path`, `pattern` | Glob pattern match on paths |

### 10. Relations (3 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `ov_relations_link` | `source`, `target`, `relation_type` | Create typed edge |
| `ov_relations_get` | `uri`, `direction` | Get in/out/both edges |
| `ov_relations_unlink` | `source`, `target` | Remove relation |

### 11. Sessions (7 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `ov_sessions_create` | `session_id` (optional) | Create interaction context |
| `ov_sessions_get` | `session_id` | State and history |
| `ov_sessions_list` | — | All active sessions |
| `ov_sessions_delete` | `session_id` | End and delete |
| `ov_sessions_add_message` | `session_id`, `message` | Append message to session |
| `ov_sessions_mark_used` | `session_id` | Mark session as recently used |
| `ov_sessions_commit` | `session_id`, `wait`, `timeout` | Commit session to storage |

### 12. Tasks (2 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `ov_tasks_get` | `task_id` | Async task status and result |
| `ov_tasks_list` | `status`, `limit` | Recent tasks, filterable |

### 13. Observer (4 tools)

| Tool | Description |
|------|-------------|
| `ov_observer_system_get` | System-level metrics and status |
| `ov_observer_queue_get` | Queue depth and processing stats |
| `ov_observer_vikingdb_get` | VikingDB storage metrics |
| `ov_observer_vlm_get` | Vision-language model metrics |

### 14. Debug (1 tool)

| Tool | Description |
|------|-------------|
| `ov_debug_health_get` | Extended health diagnostics |

### 15. Admin (8 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `ov_admin_accounts_create` | `name` | Create tenant account |
| `ov_admin_accounts_list` | — | List all accounts |
| `ov_admin_accounts_delete` | `account_id` | Delete account |
| `ov_admin_users_create` | `account_id`, `username` | Create user in account |
| `ov_admin_users_list` | `account_id` | List users |
| `ov_admin_users_delete` | `account_id`, `user_id` | Delete user |
| `ov_admin_user_role_update` | `account_id`, `user_id`, `role` | Update user role |
| `ov_admin_user_key_create` | `account_id`, `user_id` | Create scoped API key |

### Legacy compat aliases (5 tools)

Provided for backward compatibility. Note: signatures differ from the
collection-based items API.

| Alias | Key params | Notes |
|-------|-----------|-------|
| `search_by_text` | `query`, `top_k?`, `collection_path?` | Semantic search |
| `upsert_data` | `content`, `filename`, `collection_path?` | Upload content as file |
| `fetch_data` | `uri` | Fetch by `viking://resources/...` URI (`ov:///...` alias also accepted) |
| `list_collection` | `uri?` | List collection at URI |
| `delete_data` | `uri` | Delete by `viking://resources/...` URI (`ov:///...` alias also accepted) |

## Guardrails

- **Never delete a collection without explicit user confirmation** — `ov_fs_delete`
  is irreversible and removes all stored data.
- **Check `ov_health_get` before any write sequence** — partial ingestion
  is difficult to recover from.
- **Poll `ov_tasks_get` after `ov_pack_import`** — large packs are async;
  do not assume completion.
- **Treat `ov_content_abstract` and `ov_content_overview` as reads, not writes**
  — they return generated summary artifacts and do not synthesize on demand.
- **Keep using `target` with `ov_resources_create`**
  — the MCP wrapper translates it to the upstream REST field for you.
- **Do not change `OPENVIKING_EMBED_MODEL` after data is stored** without
  recreating affected collections — dimension mismatch breaks search silently.
- **Do not commit `container/.env`** — API keys must stay out of version control.
- **Do not assume item IDs are unique across collections** — IDs are scoped per
  collection.
- **Pass `account_id` and `user_id` on data-plane calls** when using the root
  API key — omitting them returns `400 INVALID_ARGUMENT`.

## Out of Scope

This skill covers the nordic-mcp MCP server and REST API. It does not cover:

- Docker stack setup and troubleshooting → see [docs/getting-started.md](../../docs/getting-started.md)
- Embedding model selection or tuning → see [CONCEPTS.md](../../CONCEPTS.md)
- Plugin installation and Claude integration → see [README.md](../../README.md)
- OpenViking internals or upstream bug reports

## Primary Grounding

This skill documents the `nordic-mcp` MCP server at version `2.0.0`, which wraps
OpenViking `v0.2.9`. Tool signatures and REST endpoint paths reflect the
OpenViking REST API as of that release. If the OpenViking version is upgraded,
verify tool behavior against the upstream changelog before using this skill.

Key runtime facts:

- Public endpoint: `http://127.0.0.1:1933`
- MCP path: `/mcp` (via nginx)
- REST base: `/api/v1/`
- Auth: `Authorization: Bearer <OPENVIKING_ROOT_API_KEY>`
- Embedding default: `text-embedding-3-large`, dimension `3072`
- OpenAI-compatible endpoints such as LM Studio are supported when
  `OPENVIKING_EMBED_*` and `OPENVIKING_VLM_*` are configured to match the
  loaded local models, and invalid vector scores are filtered before search
  results are returned
- Data directory: `$HOME/.nordic_mcp/openviking-data`

## Adjacent Skills

- When the user needs to **start or configure the stack**: use slash commands
  `/nordic-mcp-start`, `/nordic-mcp-config` → hand off to
  `nordic-mcp-orchestrator` agent.
- When the user hits a **persistent error not covered by pitfalls.md**: escalate
  to the `nordic-mcp-orchestrator` agent with full error context.
- When the user wants to **build a new collection schema**: begin with
  `ov_fs_mkdir` → `ov_resources_create` → `ov_search_search` to
  validate relevance before bulk ingestion.

## Verification Checklist

Before reporting a task complete:

- [ ] `ov_health_get` returns `{"status":"ok"}`
- [ ] Target collection shows correct `item_count` via `ov_fs_stat`
- [ ] Representative search returns relevant results via `ov_search_search`
- [ ] No failed async tasks: `ov_tasks_list` with `status: "failed"` is empty
- [ ] No collection was deleted without explicit user confirmation

## Example Prompts

```text
"Store these meeting notes in my notes collection"
"Search for anything about budget decisions"
"Create a new collection called project-docs and upload this document"
"How many items are in my research collection?"
"Find content related to machine learning across all collections"
"Show me what's linked to item doc-042"
```
