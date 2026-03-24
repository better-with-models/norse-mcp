# nordic-mcp Workflow Playbook

> All data-plane tools require `account_id` and `user_id` params when using
> the root API key. These are omitted from pattern steps for brevity but must
> be included in every call.

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
                                  (pass account_id, user_id with root key)
2. ov_resources_temp_upload     → upload content to container temp space
3. ov_resources_create          → ingest from temp_path into collection (wait:true)
4. ov_fs_ls                     → verify at least one entry exists in collection
```

## Pattern 3: Search and retrieve

```text
1. ov_search_search             → semantic search (default)
   OR
   ov_search_find               → when scoping to a collection or filter precision matters
2. ov_content_read              → retrieve full content by URI from search results
3. ov_relations_get             → follow relation graph if needed
```

## Pattern 4: Bulk ingest via pack

```text
1. ov_pack_import               → upload items in batch (async)
2. ov_tasks_get                 → poll async task status
3. ov_fs_ls                     → verify entries exist in collection
```

## Pattern 5: Multi-turn session

```text
1. ov_sessions_create           → create session context
2. ov_search_search             → search within session
3. ov_sessions_commit           → commit session to storage when done
4. ov_sessions_delete           → clean up when done
```

## Pattern 6: Shutdown

```text
1. /nordic-mcp-stop             → docker compose down
   (data in $HOME/.nordic_mcp/ is preserved)
```
