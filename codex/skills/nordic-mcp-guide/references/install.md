# nordic-mcp Codex Installation

Use this guide for Codex-specific setup. Claude plugin installation is separate
and continues to use `.claude-plugin/plugin.json`.

## What Codex needs

Codex uses two separate install surfaces:

1. A Codex skill package
2. An MCP client configuration entry

Both are required for the full Codex experience.

## GitHub install

Install the skill from this repo with `$skill-installer`:

```text
scripts/install-skill-from-github.py --repo better-with-models/norse-mcp --path codex/skills/nordic-mcp-guide
```

After installing the skill, restart Codex to pick up new skills.

## Local checkout install

From a local checkout of this repo, copy or link:

```text
codex/skills/nordic-mcp-guide
```

into:

```text
$CODEX_HOME/skills/nordic-mcp-guide
```

After installing the skill, restart Codex to pick up new skills.

## Runtime setup

Before configuring MCP, configure the Docker runtime:

1. Copy `container/.env.example` to `container/.env`
2. Set `OPENVIKING_ROOT_API_KEY`
3. Set `OPENAI_API_KEY`
4. Start the stack with `docker compose up -d` from `container/`

Health check:

```text
http://127.0.0.1:1933/health
```

Expected response:

```json
{"status":"ok"}
```

## Codex MCP configuration

Use the running HTTP endpoint through `mcp-remote`:

```json
{
  "mcpServers": {
    "nordic-mcp": {
      "command": "npx",
      "args": ["mcp-remote", "http://127.0.0.1:1933/mcp"]
    }
  }
}
```

This reuses the same remote wrapper pattern as the Claude plugin manifest.

## Verification

After restarting Codex:

1. Confirm the skill is available
2. Confirm the `nordic-mcp` MCP server is connected
3. Run `ov_health_get`
4. Run one read tool such as `ov_system_status_get`
5. Prefer `viking://resources/...` URIs in new workflows. The wrapper still
   accepts `ov:///...` as a compatibility alias.

If the server is not reachable, check [pitfalls.md](pitfalls.md).
