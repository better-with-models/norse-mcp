# nordic-mcp Workflow Playbook

## Pattern 1: Codex setup

```text
1. Install the Codex skill
2. Configure container/.env
3. Start the Docker stack
4. Add nordic-mcp to Codex MCP config
5. Restart Codex
6. ov_health_get
7. ov_system_status_get
```

## Pattern 2: Ingest a document

```text
1. ov_fs_mkdir
2. ov_resources_temp_upload
3. ov_resources_create
4. ov_fs_ls
```

## Pattern 3: Search and retrieve

```text
1. ov_search_find
   OR
   ov_search_search
2. ov_content_read
   OR
   nordic_fetch_item
3. ov_relations_get
```

## Pattern 4: Bulk ingest via pack

```text
1. ov_pack_export
   OR
   ov_pack_import
2. ov_tasks_get
3. ov_tasks_list
```
