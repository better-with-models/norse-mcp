---
name: nordic-mcp Guide
description: Complete reference for using the nordic-mcp OpenViking vector-database MCP server from Codex, including skill installation, MCP client setup, and the 40-tool usage surface.
---

# nordic-mcp Guide

Portable Codex skill for installing, connecting to, and using the `nordic-mcp`
OpenViking vector-database MCP server.

## Intent Router

Load this skill when the user wants to:

- Install `nordic-mcp` into Codex from GitHub or a local checkout
- Configure Codex to connect to the running MCP server
- Start the Docker stack and verify the server is healthy
- Store, search, or manage content with the `nordic_*` MCP tools
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
5. Confirm `nordic_health_check` returns `{"status":"ok"}`

For exact commands, see [references/install.md](references/install.md).

## Input Contract

Before calling any write tools, confirm:

- The Docker stack is running and healthy
- `collection` is a stable name
- `id` values are unique within the collection
- `text` values are UTF-8 strings
- The runtime API key has been configured in `container/.env`

Before calling search tools, confirm:

- The target collection exists and contains items
- The query is a natural-language phrase, not just keywords

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
- At least one `nordic_*` tool call succeeds end-to-end

After completing an ingest workflow, confirm:

- Collection item count increased as expected
- A representative search returns relevant results
- No failed async tasks remain

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

| Alias | Maps to |
|-------|---------|
| `search_by_text` | `nordic_search` |
| `upsert_data` | `nordic_upsert_item` |
| `fetch_data` | `nordic_fetch_item` |
| `list_collection` | `nordic_list_collections` |
| `delete_data` | `nordic_delete_item` |

## Guardrails

- Never delete a collection without explicit user confirmation.
- Check `nordic_health_check` before any write sequence.
- Poll `nordic_get_task` after `nordic_ingest_pack`.
- Do not change the embedding model after data has been stored unless you plan to rebuild affected collections.
- Do not commit `container/.env`.

## Verification Checklist

- [ ] Docker stack is healthy
- [ ] `nordic_health_check` returns `{"status":"ok"}`
- [ ] Codex skill is installed and available after restart
- [ ] Codex MCP server entry points to `http://127.0.0.1:1933/mcp`
- [ ] At least one `nordic_*` tool call succeeds

