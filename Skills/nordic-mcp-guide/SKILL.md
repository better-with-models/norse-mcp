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
- Understand all available tools → [MCP tool reference](#mcp-tool-reference--40-tools-13-families)

Related docs:
- [docs/mcp-coverage-matrix.md](../../docs/mcp-coverage-matrix.md) — exhaustive REST endpoint map
- [docs/getting-started.md](../../docs/getting-started.md) — first-use walkthrough
- [references/workflow.md](references/workflow.md) — execution patterns
- [references/examples.md](references/examples.md) — representative tool call examples
- [references/pitfalls.md](references/pitfalls.md) — common mistakes and diagnostics

## Quick Start

1. Confirm the stack is healthy: `nordic_health_check` → `{"status":"ok"}`
2. Create or confirm a collection: `nordic_create_collection` with a unique `name`
3. Store content: `nordic_chunk_and_store` (long text) or `nordic_upsert_item` (pre-chunked)
4. Search: `nordic_search` with a natural-language `query`
5. Retrieve a full item: `nordic_fetch_item` with the `id` from search results

## Input Contract

Before calling any write tools, confirm:

- Stack is running and healthy (`nordic_health_check` returns `{"status":"ok"}`)
- `collection` name is a stable slug — collections persist across restarts
- `id` values are unique within the collection
- `text` content is UTF-8 string (not binary)
- API key available (MCP server handles auth internally; confirm `.env` is set)

Before calling search tools, confirm:

- Collection exists and has items (`nordic_get_collection` shows `item_count > 0`)
- Query is a natural-language phrase, not a keyword list

## Workflow

### Ingest pattern

```
1. nordic_health_check          → verify stack is up
2. nordic_create_collection     → idempotent — OK to call on existing collection
3. nordic_chunk_and_store       → for documents > 512 tokens
   OR nordic_upsert_item        → for pre-chunked or short items
4. nordic_get_collection        → verify item count increased
```

### Search pattern

```
1. nordic_search                → semantic vector search (default choice)
   OR nordic_hybrid_search      → when keyword precision matters (alpha < 0.7)
   OR nordic_multi_collection_search → when content spans collections
2. nordic_fetch_item            → retrieve full content for top result(s)
3. nordic_get_relations         → optional: follow graph edges to related items
```

### Pack ingest pattern

For bulk ingestion (> 100 items or large documents):

```
1. nordic_create_pack           → create named bundle
2. nordic_ingest_pack           → upload items in batches (triggers async task)
3. nordic_get_task              → poll until status = "completed"
4. nordic_get_pack              → verify item count
5. nordic_search                → spot-check results
```

## Architecture

```
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

- Collection item count reflects all ingested content
- At least one representative search returns relevant results
- No failed async tasks (`nordic_list_tasks` with `status: "failed"` returns empty)

After completing a search workflow, deliver:

- Ranked list of matching items with IDs and relevance scores
- Full text of the top result(s) via `nordic_fetch_item`
- Related items via `nordic_get_relations` when graph context was requested

## MCP Tool Reference — 40 tools, 13 families

### 1. Health (1 tool)

| Tool | Description |
|------|-------------|
| `nordic_health_check` | Verify server is reachable and healthy |

### 2. System (2 tools)

| Tool | Description |
|------|-------------|
| `nordic_system_info` | Version and capabilities |
| `nordic_system_stats` | Collection count, total vectors, memory usage |

### 3. Resources / Collections (4 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_list_collections` | — | List all collections |
| `nordic_create_collection` | `name`, `description` | Create named collection |
| `nordic_get_collection` | `collection` | Metadata and stats |
| `nordic_delete_collection` | `collection` | Delete permanently — irreversible |

### 4. Items (4 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_upsert_item` | `collection`, `items[]` | Insert or update items |
| `nordic_fetch_item` | `collection`, `id` | Retrieve item by ID |
| `nordic_delete_item` | `collection`, `id` | Delete item by ID |
| `nordic_list_items` | `collection`, `limit`, `offset` | Paginated listing |

### 5. Pack — bulk ingestion (5 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_create_pack` | `collection`, `pack_id` | Create named bundle |
| `nordic_ingest_pack` | `collection`, `pack_id`, `items[]` | Bulk-add (async) |
| `nordic_get_pack` | `collection`, `pack_id` | Status and metadata |
| `nordic_list_packs` | `collection` | List all packs in collection |
| `nordic_delete_pack` | `collection`, `pack_id` | Delete pack and items |

### 6. Filesystem (3 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_upload_file` | `collection`, `file_path`, `item_id` | Upload server-side file |
| `nordic_list_files` | `collection` | List file-backed items |
| `nordic_delete_file` | `collection`, `item_id` | Remove file-backed item |

### 7. Content (2 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_chunk_and_store` | `collection`, `text`, `doc_id`, `chunk_size` | Auto-chunk and embed |
| `nordic_get_chunk` | `collection`, `chunk_id` | Retrieve chunk by ID |

### 8. Search (3 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_search` | `collection`, `query`, `top_k`, `filter` | Semantic vector search |
| `nordic_hybrid_search` | `collection`, `query`, `alpha` | Vector + keyword, 0=keyword, 1=vector |
| `nordic_multi_collection_search` | `collections[]`, `query` | Cross-collection search |

### 9. Relations (3 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_add_relation` | `collection`, `source_id`, `target_id`, `relation_type` | Create typed edge |
| `nordic_get_relations` | `collection`, `item_id`, `direction` | Get in/out/both edges |
| `nordic_delete_relation` | `collection`, `relation_id` | Remove relation |

### 10. Sessions (4 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_create_session` | `session_id` (optional) | Create interaction context |
| `nordic_get_session` | `session_id` | State and history |
| `nordic_list_sessions` | — | All active sessions |
| `nordic_delete_session` | `session_id` | End and delete |

### 11. Tasks (3 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_get_task` | `task_id` | Async task status and result |
| `nordic_list_tasks` | `status`, `limit` | Recent tasks, filterable |
| `nordic_cancel_task` | `task_id` | Cancel pending task |

### 12. Observer (2 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_get_metrics` | — | Request rates, latencies, error counts |
| `nordic_get_events` | `limit`, `level` | Server event log |

### 13. Admin (4 tools)

| Tool | Key params | Description |
|------|-----------|-------------|
| `nordic_create_api_key` | `name`, `collections[]`, `read_only` | Create scoped key |
| `nordic_list_api_keys` | — | List keys (no values exposed) |
| `nordic_revoke_api_key` | `key_id` | Revoke key |
| `nordic_trigger_backup` | `label` | Point-in-time backup |

### Legacy aliases (5 tools)

Provided for backward compatibility with prompts written against the original
OpenViking API surface.

| Alias | Maps to |
|-------|---------|
| `search_by_text` | `nordic_search` |
| `upsert_data` | `nordic_upsert_item` |
| `fetch_data` | `nordic_fetch_item` |
| `list_collection` | `nordic_list_collections` |
| `delete_data` | `nordic_delete_item` |

## Guardrails

- **Never delete a collection without explicit user confirmation** — all stored
  data is permanently lost.
- **Check `nordic_health_check` before any write sequence** — partial ingestion
  is difficult to recover from.
- **Poll `nordic_get_task` after `nordic_ingest_pack`** — large packs are async;
  do not assume completion.
- **Do not change `OPENVIKING_EMBEDDING_MODEL` after data is stored** without
  recreating affected collections — dimension mismatch breaks search silently.
- **Do not commit `container/.env`** — API keys must stay out of version control.
- **Do not assume item IDs are unique across collections** — IDs are scoped per
  collection.

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
- Data directory: `$HOME/.nordic_mcp/openviking-data`

## Adjacent Skills

- When the user needs to **start or configure the stack**: use slash commands
  `/nordic-mcp-start`, `/nordic-mcp-config` → hand off to
  `nordic-mcp-orchestrator` agent.
- When the user hits a **persistent error not covered by pitfalls.md**: escalate
  to the `nordic-mcp-orchestrator` agent with full error context.
- When the user wants to **build a new collection schema**: begin with
  `nordic_create_collection` → `nordic_chunk_and_store` → `nordic_search` to
  validate relevance before bulk ingestion.

## Verification Checklist

Before reporting a task complete:

- [ ] `nordic_health_check` returns `{"status":"ok"}`
- [ ] Target collection shows correct `item_count` via `nordic_get_collection`
- [ ] Representative search returns relevant results via `nordic_search`
- [ ] No failed async tasks: `nordic_list_tasks` with `status: "failed"` is empty
- [ ] No collection was deleted without explicit user confirmation

## Example Prompts

```
"Store these meeting notes in my notes collection"
"Search for anything about budget decisions"
"Create a new collection called project-docs and upload this document"
"How many items are in my research collection?"
"Find content related to machine learning across all collections"
"Show me what's linked to item doc-042"
```
