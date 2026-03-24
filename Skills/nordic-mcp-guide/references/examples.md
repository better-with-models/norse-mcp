# nordic-mcp Usage Examples

Representative tool call sequences for common tasks.

> **Auth note:** All data-plane tools require `account_id` and `user_id` when
> using the root API key. The examples below use `"default"` for both, which
> is correct for the default tenant. Omitting these returns `400 INVALID_ARGUMENT`.

## Example 1: Store and search notes

```json
// Create a collection (directory)
{ "tool": "ov_fs_mkdir", "args": { "uri": "viking://resources/my-notes", "account_id": "default", "user_id": "default" } }

// Step 1: Upload content to container temp space
{ "tool": "ov_resources_temp_upload", "args": {
  "content": "Meeting notes from Q1 review: budget approved, headcount +3",
  "filename": "note-001.txt",
  "account_id": "default",
  "user_id": "default"
}}
// → use returned temp_path in next call

// Step 2: Ingest from temp_path into collection
{ "tool": "ov_resources_create", "args": {
  "path": "<temp_path from step above>",
  "target": "viking://resources/my-notes/note-001",
  "wait": true,
  "account_id": "default",
  "user_id": "default"
}}

// Search notes (scoped to collection via target_uri)
{ "tool": "ov_search_find", "args": {
  "query": "budget decisions",
  "target_uri": "viking://resources/my-notes",
  "limit": 3,
  "account_id": "default",
  "user_id": "default"
}}
```

## Example 2: Ingest a long document

```json
// Step 1: Upload document content to container temp space
{ "tool": "ov_resources_temp_upload", "args": {
  "content": "...(full document text)...",
  "filename": "report-2026-q1.txt",
  "account_id": "default",
  "user_id": "default"
}}
// → use returned temp_path in next call

// Step 2: Ingest and auto-chunk from temp_path
{ "tool": "ov_resources_create", "args": {
  "path": "<temp_path from step 1>",
  "target": "viking://resources/documents/report-2026-q1",
  "wait": true,
  "account_id": "default",
  "user_id": "default"
}}

// Follow-up reads use the returned root_uri (or the target URI if known)
{ "tool": "ov_content_overview", "args": { "uri": "viking://resources/documents/report-2026-q1", "account_id": "default", "user_id": "default" } }
```

## Example 3: Search with filter

```json
// Global semantic search
{ "tool": "ov_search_search", "args": {
  "query": "revenue growth",
  "limit": 5
}}

// Scoped search within a collection
{ "tool": "ov_search_find", "args": {
  "query": "revenue growth",
  "target_uri": "viking://resources/documents",
  "limit": 5,
  "account_id": "default",
  "user_id": "default"
}}
```

## Example 4: Build a knowledge graph

```json
// Add relation
{ "tool": "ov_relations_link", "args": {
  "source": "viking://resources/documents/chunk-001",
  "target": "viking://resources/documents/chunk-042",
  "relation_type": "references",
  "account_id": "default",
  "user_id": "default"
}}

// Follow the graph
{ "tool": "ov_relations_get", "args": {
  "uri": "viking://resources/documents/chunk-001",
  "direction": "out",
  "account_id": "default",
  "user_id": "default"
}}
```

## Example 5: Check system health

```json
{ "tool": "ov_health_get", "args": {} }
{ "tool": "ov_system_status_get", "args": {} }
{ "tool": "ov_observer_system_get", "args": {} }
```

## Example 6: Legacy alias usage (compat tools)

> **Note:** Legacy aliases do not accept `account_id`/`user_id` params.
> They are provided for backward compatibility only; prefer the primary tools above.

```json
// Upload content via legacy alias
{ "tool": "upsert_data", "args": { "content": "Note text here", "filename": "note-001.txt", "collection_path": "/my-notes" } }

// Search via legacy alias
{ "tool": "search_by_text", "args": { "query": "budget decisions", "collection_path": "/my-notes", "top_k": 3 } }

// Fetch by URI
{ "tool": "fetch_data", "args": { "uri": "viking://resources/my-notes/note-001.txt" } }
```
