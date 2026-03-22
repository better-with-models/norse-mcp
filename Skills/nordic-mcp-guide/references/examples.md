# nordic-mcp Usage Examples

Representative tool call sequences for common tasks.

## Example 1: Store and search notes

```json
// Create a collection
{ "tool": "nordic_create_collection", "args": { "name": "my-notes", "description": "Personal notes" } }

// Store a note
{ "tool": "nordic_upsert_item", "args": {
  "collection": "my-notes",
  "items": [{ "id": "note-001", "text": "Meeting notes from Q1 review: budget approved, headcount +3", "metadata": { "date": "2026-01-15", "type": "meeting" } }]
}}

// Search notes
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

## Example 3: Hybrid search with filter

```json
{ "tool": "nordic_hybrid_search", "args": {
  "collection": "documents",
  "query": "revenue growth",
  "top_k": 5,
  "alpha": 0.6,
  "filter": { "author": "Finance" }
}}
```

## Example 4: Build a knowledge graph

```json
// Add relation
{ "tool": "nordic_add_relation", "args": {
  "collection": "documents",
  "source_id": "chunk-001",
  "target_id": "chunk-042",
  "relation_type": "references"
}}

// Follow the graph
{ "tool": "nordic_get_relations", "args": {
  "collection": "documents",
  "item_id": "chunk-001",
  "direction": "out"
}}
```

## Example 5: Check system health

```json
{ "tool": "nordic_health_check", "args": {} }
{ "tool": "nordic_system_stats", "args": {} }
{ "tool": "nordic_get_metrics", "args": {} }
```
