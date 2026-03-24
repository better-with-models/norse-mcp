# nordic-mcp Workflow Playbook

Standard execution patterns for common nordic-mcp operations.

## Pattern 1: First-time setup

```text
1. /nordic-mcp-config           → configure .env
2. python3 scripts/preflight.py → verify environment
3. /nordic-mcp-start            → start stack, wait for health
4. ov_system_status_get         → confirm version and capabilities
```

## Pattern 2: Ingest a document

```text
1. ov_fs_mkdir                  → create collection directory if new
2. ov_resources_create          → ingest and embed content (set wait:true for sync)
   OR
   nordic_upsert_item           → directly store pre-chunked items
3. ov_fs_stat                   → verify item count
```

## Pattern 3: Search and retrieve

```text
1. ov_search_search             → semantic search (default)
   OR
   ov_search_find               → when keyword/filter precision matters
2. nordic_fetch_item            → retrieve full content by ID
3. ov_relations_get             → follow relation graph if needed
```

## Pattern 4: Bulk ingest via pack

```text
1. ov_pack_import               → upload items in batch (async)
2. ov_tasks_get                 → poll async task status
3. ov_fs_stat                   → verify ingestion complete
```

## Pattern 5: Multi-turn session

```text
1. ov_sessions_create           → create session context
2. ov_search_search             → search within session
3. nordic_upsert_item           → add derived items
4. ov_sessions_delete           → clean up when done
```

## Pattern 6: Shutdown

```text
1. /nordic-mcp-stop             → docker compose down
   (data in $HOME/.nordic_mcp/ is preserved)
```
