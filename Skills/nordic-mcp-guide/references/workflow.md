# nordic-mcp Workflow Playbook

Standard execution patterns for common nordic-mcp operations.

## Pattern 1: First-time setup

```text
1. /nordic-mcp-config           → configure .env
2. python scripts/preflight.py  → verify environment
3. /nordic-mcp-start            → start stack, wait for health
4. nordic_system_info           → confirm version and capabilities
```

## Pattern 2: Ingest a document

```text
1. nordic_create_collection     → create collection if new
2. nordic_chunk_and_store       → chunk and embed text
   OR
   nordic_upsert_item           → directly store pre-chunked items
3. nordic_get_collection        → verify item count
```

## Pattern 3: Search and retrieve

```text
1. nordic_search                → semantic search (default)
   OR
   nordic_hybrid_search         → when keyword precision matters
2. nordic_fetch_item            → retrieve full content by ID
3. nordic_get_relations         → follow relation graph if needed
```

## Pattern 4: Bulk ingest via pack

```text
1. nordic_create_pack           → create pack namespace
2. nordic_ingest_pack           → upload items in batches
3. nordic_get_task              → poll async task status
4. nordic_get_pack              → verify ingestion complete
```

## Pattern 5: Multi-turn session

```text
1. nordic_create_session        → create session context
2. nordic_search                → search within session
3. nordic_upsert_item           → add derived items
4. nordic_delete_session        → clean up when done
```

## Pattern 6: Shutdown

```text
1. /nordic-mcp-stop             → docker compose down
   (data in $HOME/.nordic_mcp/ is preserved)
```
