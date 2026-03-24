# nordic-mcp Usage Examples

Representative tool call sequences for common tasks.

## Example 1: Store and search notes

```json
// Create a collection (directory)
{ "tool": "ov_fs_mkdir", "args": { "uri": "viking://resources/my-notes" } }

// Store a note (pre-chunked)
{ "tool": "nordic_upsert_item", "args": {
  "collection": "/my-notes",
  "items": [{ "id": "note-001", "text": "Meeting notes from Q1 review: budget approved, headcount +3", "metadata": { "date": "2026-01-15", "type": "meeting" } }]
}}

// Search notes
{ "tool": "ov_search_search", "args": { "collection_path": "/my-notes", "query": "budget decisions", "top_k": 3 } }
```

## Example 2: Ingest a long document

```json
// Ingest and auto-chunk a document via resource ingestion
{ "tool": "ov_resources_create", "args": {
  "path": "/path/to/report-2026-q1.txt",
  "target": "viking://resources/documents/report-2026-q1",
  "wait": true
}}

// Follow-up reads should use the returned root_uri from ov_resources_create
{ "tool": "ov_content_overview", "args": { "uri": "viking://resources/documents/report-2026-q1" } }
```

## Example 3: Search with filter

```json
{ "tool": "ov_search_search", "args": {
  "query": "revenue growth",
  "limit": 5
}}
```

## Example 4: Build a knowledge graph

```json
// Add relation
{ "tool": "ov_relations_link", "args": {
  "source": "viking://resources/documents/chunk-001",
  "target": "viking://resources/documents/chunk-042",
  "relation_type": "references"
}}

// Follow the graph
{ "tool": "ov_relations_get", "args": {
  "uri": "viking://resources/documents/chunk-001",
  "direction": "out"
}}
```

## Example 5: Check system health

```json
{ "tool": "ov_health_get", "args": {} }
{ "tool": "ov_system_status_get", "args": {} }
{ "tool": "ov_observer_system_get", "args": {} }
```

## Example 6: Legacy alias usage (compat tools)

```json
// Upload content via legacy alias
{ "tool": "upsert_data", "args": { "content": "Note text here", "filename": "note-001.txt", "collection_path": "/my-notes" } }

// Search via legacy alias
{ "tool": "search_by_text", "args": { "query": "budget decisions", "collection_path": "/my-notes", "top_k": 3 } }

// Fetch by URI
{ "tool": "fetch_data", "args": { "uri": "viking://resources/my-notes/note-001.txt" } }
```
