# nordic-mcp Workflow Playbook

## Pattern 1: Codex setup

```text
1. Install the Codex skill
2. Configure container/.env
3. Start the Docker stack
4. Add nordic-mcp to Codex MCP config
5. Restart Codex
6. nordic_health_check
```

## Pattern 2: Ingest a document

```text
1. nordic_create_collection
2. nordic_chunk_and_store
   OR
   nordic_upsert_item
3. nordic_get_collection
```

## Pattern 3: Search and retrieve

```text
1. nordic_search
   OR
   nordic_hybrid_search
2. nordic_fetch_item
3. nordic_get_relations
```

## Pattern 4: Bulk ingest via pack

```text
1. nordic_create_pack
2. nordic_ingest_pack
3. nordic_get_task
4. nordic_get_pack
```

