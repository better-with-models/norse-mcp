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
3. Check item count with `ov_fs_stat` — empty collection returns no results.
4. Try `ov_search_search` with a broader `collection_path` if content spans collections.
