# nordic-mcp Common Pitfalls

## P1: Stack not running

**Symptom:** All tool calls fail with connection refused.

**Fix:** Run `/nordic-mcp-start`. Check `docker compose ps` shows the container as healthy.

## P2: Missing or wrong API key

**Symptom:** 401 Unauthorized on authenticated endpoints.

**Fix:** Confirm `OPENVIKING_ROOT_API_KEY` in `container/.env` matches what was
set when the container was built/started. Restart after editing `.env`.

## P3: Changing embedding model after data is stored

**Symptom:** Search returns no results or errors about dimension mismatch.

**Root cause:** Collections are built with a fixed embedding dimension. Changing
`OPENVIKING_EMBED_MODEL` or `OPENVIKING_EMBED_DIMENSION` after ingestion breaks
existing indexes.

**Fix:** Delete and recreate affected collections after changing the model.

## P4: Data not persisting across restarts

**Symptom:** Collections empty after `docker compose down && docker compose up`.

**Root cause:** `NORDIC_MCP_DATA` in `.env` may be set to a path that doesn't
survive container restarts, or the volume mount failed.

**Fix:** Confirm `$HOME/.nordic_mcp/openviking-data` exists and the docker-compose
volume mount is correct. Check `docker compose logs` for permission errors.

## P5: Port 1933 already in use

**Symptom:** `docker compose up` fails with "port already allocated".

**Fix:** Find and stop the conflicting process:

```bash
lsof -i :1933     # macOS/Linux
netstat -ano | findstr :1933  # Windows
```

## P6: Large documents causing timeout

**Symptom:** `ov_resources_create` times out for very large files.

**Fix:** Use `ov_pack_import` for batch ingestion,
then poll `ov_tasks_get` for async completion.

## P7: Search returns irrelevant results

**Diagnosis steps:**

1. Confirm the correct collection name.
2. Try `ov_search_find` for keyword/filter precision instead of semantic search.
3. Check for entries with `ov_fs_ls` — empty collection returns no results.
4. Use `ov_search_find` with `target_uri` to scope to a specific collection.

## P8: Deleting a non-empty collection fails

**Symptom:** `ov_fs_delete` on a collection directory returns HTTP 500
"directory not empty".

**Root cause:** The filesystem API does not support recursive deletion.
Every child resource must be deleted before the parent directory can be removed.
Additionally, every ingested subdirectory generates two hidden artifacts —
`.abstract.md` and `.overview.md` — that are **not** returned by `ov_fs_ls`
but still block directory deletion.

**Fix:**
1. List visible children with `ov_fs_ls`; delete each with `ov_fs_delete`.
2. For each subdirectory level, also delete the hidden artifacts via REST:
   `DELETE /api/v1/fs?uri=<dir_uri>/.abstract.md` and `.../.overview.md`
3. Work from leaf nodes upward. Use `ov_fs_tree` to get a full recursive view.
4. Even after removing all known children, a directory-level index entry may
   remain — retry deletion from deepest leaf to root.

## P9: MCP session expires between calls

**Symptom:** Tool calls return `{"error":"Session not found"}` after a pause
in the conversation.

**Root cause:** MCP sessions are short-lived and expire after inactivity.

**Fix:** Re-initialize by calling `initialize` again (or re-connecting via
`npx mcp-remote`). The session ID in `Mcp-Session-Id` response header changes
on each new initialize — update any saved session ID.
