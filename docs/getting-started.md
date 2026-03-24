# Getting Started with nordic-mcp

This walkthrough gets you from zero to a working MCP server with stored and
searchable content.

## Requirements

- Docker Desktop (or Docker Engine + Compose) ≥ 20.10
- An OpenAI-compatible endpoint and credentials for embeddings and optional VLM
  (OpenAI or a local OpenAI-compatible server such as LM Studio)
- Claude desktop app or Claude Code with plugin support
- Codex, if you want to use the Codex skill + MCP flow

## Step 1: Configure

```bash
cd path/to/nordic-mcp/container
cp .env.example .env
```

Open `.env` and set:

```text
OPENVIKING_ROOT_API_KEY=your-secret-key-here
OPENAI_API_KEY=sk-...
```

If you are using a local OpenAI-compatible server instead of the public OpenAI
API, also update:

```text
OPENVIKING_EMBED_API_BASE=...
OPENVIKING_EMBED_MODEL=...
OPENVIKING_EMBED_DIMENSION=...
OPENVIKING_VLM_API_BASE=...
OPENVIKING_VLM_MODEL=...
```

Leave the other values at their defaults unless you need a different model or
data directory.

## Step 2: Run the preflight check

```bash
python ../scripts/preflight.py
```

All checks should pass before proceeding. Fix any reported issues.

## Step 3: Start the stack

```bash
docker compose up -d
```

Or from Claude: `/nordic-mcp-start`

Wait for the health check to pass:

```bash
curl http://127.0.0.1:1933/health
# {"status":"ok"}
```

## Step 4: Choose a client install path

### Claude desktop or Claude Code

Install the plugin from:

```text
nordic-mcp/.claude-plugin/plugin.json
```

This registers the `nordic-mcp` MCP server, connecting Claude to the running
container via `npx mcp-remote http://127.0.0.1:1933/mcp`.

### Codex

Codex does not use `.claude-plugin/plugin.json` as its install surface.

Instead:

1. Install the Codex skill from `codex/skills/nordic-mcp-guide`
2. Configure Codex MCP to use `npx mcp-remote http://127.0.0.1:1933/mcp`
3. Restart Codex to pick up new skills

Detailed instructions: [codex-install.md](codex-install.md)

## Step 5: Create a collection and store content

Using the MCP tools:

```json
{ "tool": "ov_fs_mkdir", "args": { "uri": "viking://resources/my-docs" } }

{ "tool": "ov_resources_temp_upload", "args": {
  "content": "Your document content goes here...",
  "filename": "intro-001.md",
  "mime_type": "text/markdown"
}}

{ "tool": "ov_resources_create", "args": {
  "path": "/tmp/from-previous-step.md",
  "target": "viking://resources/my-docs/intro-001.md",
  "wait": true
}}
```

Prefer `viking://resources/...` URIs in new workflows. The wrapper still accepts
`ov:///...` as a compatibility alias if you see it in older examples.

## Step 6: Search

```json
{ "tool": "ov_search_find", "args": {
  "query": "your search query",
  "target_uri": "viking://resources/my-docs",
  "limit": 5
}}
```

## Step 7: Verify

```json
{ "tool": "ov_fs_ls", "args": { "uri": "viking://resources/my-docs", "simple": true } }

{ "tool": "ov_system_status_get", "args": {} }

{ "tool": "ov_content_overview", "args": { "uri": "viking://resources/my-docs" } }

{ "tool": "ov_content_abstract", "args": { "uri": "viking://resources/my-docs" } }
```

Confirm the resource list matches what you ingested and the system remains
healthy. `ov_content_overview` and `ov_content_abstract` read the generated
summary artifacts for the directory, so ingest or reindex must complete before
you call them.

## Stopping the stack

```bash
cd container && docker compose down
```

Data in `$HOME/.nordic_mcp/` is preserved. Restart anytime with `docker compose up -d`.

## Next steps

- [mcp-coverage-matrix.md](mcp-coverage-matrix.md) — full tool reference
- [codex-install.md](codex-install.md) — Codex-specific install flow
- [Skills/nordic-mcp-guide/references/workflow.md](../Skills/nordic-mcp-guide/references/workflow.md) — common patterns
- [Skills/nordic-mcp-guide/references/pitfalls.md](../Skills/nordic-mcp-guide/references/pitfalls.md) — troubleshooting
