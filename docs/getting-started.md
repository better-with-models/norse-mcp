# Getting Started with nordic-mcp

This walkthrough gets you from zero to a working MCP server with stored and
searchable content.

## Requirements

- Docker Desktop (or Docker Engine + Compose) ≥ 20.10
- An OpenAI API key (for embeddings and optional VLM)
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

Leave the other values at their defaults unless you need a different embedding
model or data directory.

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
{ "tool": "nordic_create_collection", "args": { "name": "my-docs" } }

{ "tool": "nordic_chunk_and_store", "args": {
  "collection": "my-docs",
  "doc_id": "intro-001",
  "text": "Your document content goes here...",
  "chunk_size": 512
}}
```

## Step 6: Search

```json
{ "tool": "nordic_search", "args": {
  "collection": "my-docs",
  "query": "your search query",
  "top_k": 5
}}
```

## Step 7: Verify

```json
{ "tool": "nordic_get_collection", "args": { "collection": "my-docs" } }
```

Confirm the item count matches what you ingested.

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
