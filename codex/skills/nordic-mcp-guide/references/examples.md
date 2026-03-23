# nordic-mcp Usage Examples

## Example 1: Store and search notes

```json
{ "tool": "nordic_create_collection", "args": { "name": "my-notes", "description": "Personal notes" } }

{ "tool": "nordic_upsert_item", "args": {
  "collection": "my-notes",
  "items": [{ "id": "note-001", "text": "Meeting notes from Q1 review: budget approved, headcount +3", "metadata": { "date": "2026-01-15", "type": "meeting" } }]
}}

{ "tool": "nordic_search", "args": { "collection": "my-notes", "query": "budget decisions", "top_k": 3 } }
```

## Example 2: Ingest a long document

```json
{ "tool": "nordic_chunk_and_store", "args": {
  "collection": "documents",
  "doc_id": "report-2026-q1",
  "text": "...(full document text)...",
  "chunk_size": 512,
  "chunk_overlap": 64,
  "metadata": { "source": "Q1 Report", "author": "Finance" }
}}
```

## Example 3: Check system health

```json
{ "tool": "nordic_health_check", "args": {} }
{ "tool": "nordic_system_stats", "args": {} }
```

