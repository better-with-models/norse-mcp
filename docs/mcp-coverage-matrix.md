# MCP Coverage Matrix — nordic-mcp v0.1.0

40 MCP tools mapped to OpenViking REST API endpoints.

| # | MCP Tool | Method | REST Endpoint | Notes |
|---|----------|--------|---------------|-------|
| 1 | `nordic_health_check` | GET | `/health` | |
| 2 | `nordic_system_info` | GET | `/api/v1/system/info` | |
| 3 | `nordic_system_stats` | GET | `/api/v1/system/stats` | |
| 4 | `nordic_list_collections` | GET | `/api/v1/collections` | |
| 5 | `nordic_create_collection` | POST | `/api/v1/collections` | |
| 6 | `nordic_get_collection` | GET | `/api/v1/collections/{name}` | |
| 7 | `nordic_delete_collection` | DELETE | `/api/v1/collections/{name}` | Permanent |
| 8 | `nordic_upsert_item` | POST | `/api/v1/collections/{name}/items` | Batch |
| 9 | `nordic_fetch_item` | GET | `/api/v1/collections/{name}/items/{id}` | |
| 10 | `nordic_delete_item` | DELETE | `/api/v1/collections/{name}/items/{id}` | |
| 11 | `nordic_list_items` | GET | `/api/v1/collections/{name}/items` | Paginated |
| 12 | `nordic_create_pack` | POST | `/api/v1/collections/{name}/packs` | |
| 13 | `nordic_ingest_pack` | POST | `/api/v1/collections/{name}/packs/{id}/items` | Async |
| 14 | `nordic_get_pack` | GET | `/api/v1/collections/{name}/packs/{id}` | |
| 15 | `nordic_list_packs` | GET | `/api/v1/collections/{name}/packs` | |
| 16 | `nordic_delete_pack` | DELETE | `/api/v1/collections/{name}/packs/{id}` | |
| 17 | `nordic_upload_file` | POST | `/api/v1/collections/{name}/files` | Server-side path |
| 18 | `nordic_list_files` | GET | `/api/v1/collections/{name}/files` | |
| 19 | `nordic_delete_file` | DELETE | `/api/v1/collections/{name}/files/{id}` | |
| 20 | `nordic_chunk_and_store` | POST | `/api/v1/collections/{name}/content/chunk` | Auto-embed |
| 21 | `nordic_get_chunk` | GET | `/api/v1/collections/{name}/content/{id}` | |
| 22 | `nordic_search` | POST | `/api/v1/collections/{name}/search` | Vector |
| 23 | `nordic_hybrid_search` | POST | `/api/v1/collections/{name}/search/hybrid` | Vector + keyword |
| 24 | `nordic_multi_collection_search` | POST | `/api/v1/search/multi` | Cross-collection |
| 25 | `nordic_add_relation` | POST | `/api/v1/collections/{name}/relations` | |
| 26 | `nordic_get_relations` | GET | `/api/v1/collections/{name}/items/{id}/relations` | in/out/both |
| 27 | `nordic_delete_relation` | DELETE | `/api/v1/collections/{name}/relations/{id}` | |
| 28 | `nordic_create_session` | POST | `/api/v1/sessions` | |
| 29 | `nordic_get_session` | GET | `/api/v1/sessions/{id}` | |
| 30 | `nordic_list_sessions` | GET | `/api/v1/sessions` | |
| 31 | `nordic_delete_session` | DELETE | `/api/v1/sessions/{id}` | |
| 32 | `nordic_get_task` | GET | `/api/v1/tasks/{id}` | Async polling |
| 33 | `nordic_list_tasks` | GET | `/api/v1/tasks` | Filter by status |
| 34 | `nordic_cancel_task` | DELETE | `/api/v1/tasks/{id}` | |
| 35 | `nordic_get_metrics` | GET | `/api/v1/metrics` | |
| 36 | `nordic_get_events` | GET | `/api/v1/events` | Filter by level |
| 37 | `nordic_create_api_key` | POST | `/api/v1/admin/keys` | Scoped access |
| 38 | `nordic_list_api_keys` | GET | `/api/v1/admin/keys` | No key values |
| 39 | `nordic_revoke_api_key` | DELETE | `/api/v1/admin/keys/{id}` | |
| 40 | `nordic_trigger_backup` | POST | `/api/v1/admin/backup` | |

## Legacy aliases (5 tools)

| Alias | Maps to |
|-------|---------|
| `search_by_text` | `nordic_search` |
| `upsert_data` | `nordic_upsert_item` |
| `fetch_data` | `nordic_fetch_item` |
| `list_collection` | `nordic_list_collections` |
| `delete_data` | `nordic_delete_item` |

**Total exposed tools: 40 primary + 5 aliases = 45**

## Authentication

All endpoints except `/health` require:

```
Authorization: Bearer <OPENVIKING_ROOT_API_KEY>
```

The MCP server handles authentication internally — the root API key is injected
from `container/.env` at startup. Claude does not need to manage auth headers.

## Base URL

```
http://127.0.0.1:1933
```

nginx routes `POST /mcp` to the Node.js MCP server on internal port 4050;
all other paths proxy to the OpenViking REST API on internal port 1934.
