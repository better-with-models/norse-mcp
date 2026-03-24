# nordic-mcp Usage Examples

## Example 1: Store and search notes

```json
{ "tool": "ov_fs_mkdir", "args": { "uri": "viking://resources/my-notes" } }

{ "tool": "ov_resources_temp_upload", "args": {
  "content": "Meeting notes from Q1 review: budget approved, headcount +3",
  "filename": "note-001.md",
  "mime_type": "text/markdown"
}}

{ "tool": "ov_resources_create", "args": {
  "path": "/tmp/from-previous-step.md",
  "target": "viking://resources/my-notes/note-001.md",
  "wait": true
}}

{ "tool": "ov_search_find", "args": {
  "query": "budget decisions",
  "target_uri": "viking://resources/my-notes",
  "limit": 3
}}
```

## Example 2: Ingest a long document

```json
{ "tool": "ov_resources_create", "args": {
  "path": "/path/to/report-2026-q1.txt",
  "target": "viking://resources/documents/report-2026-q1",
  "wait": true
}}
```

## Example 3: Check system health

```json
{ "tool": "ov_health_get", "args": {} }
{ "tool": "ov_system_status_get", "args": {} }
```
