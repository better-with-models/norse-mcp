# Codex Install for nordic-mcp

Use this guide when you want to use `nordic-mcp` from Codex. This is separate
from Claude plugin installation.

## Codex vs Claude

Claude plugin installation uses:

```text
.claude-plugin/plugin.json
```

Codex uses two different pieces:

1. A Codex skill package at `codex/skills/nordic-mcp-guide`
2. A Codex MCP configuration entry that connects to the running server

## Track 1: Install the Codex skill

### GitHub install

Install the skill from this repo path:

```text
scripts/install-skill-from-github.py --repo better-with-models/norse-mcp --path codex/skills/nordic-mcp-guide
```

Restart Codex to pick up new skills.

### Local checkout install

Copy or link this folder:

```text
codex/skills/nordic-mcp-guide
```

into:

```text
$CODEX_HOME/skills/nordic-mcp-guide
```

Restart Codex to pick up new skills.

## Track 2: Start the MCP runtime

1. Copy `container/.env.example` to `container/.env`
2. Set `OPENVIKING_ROOT_API_KEY`
3. Set `OPENAI_API_KEY`
4. Start the stack:

```bash
cd container
docker compose up -d
```

Verify:

```bash
curl http://127.0.0.1:1933/health
```

## Track 3: Configure Codex MCP

Use the same `mcp-remote` wrapper pattern as the Claude plugin:

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

See [examples/codex-mcp-config.json](examples/codex-mcp-config.json) for a
copy-pasteable example.

## Verification

After the skill is installed and Codex is restarted:

1. Confirm the skill is available
2. Confirm the `nordic-mcp` MCP server is connected
3. Run `ov_health_get`
4. Run one additional tool like `ov_system_status_get`
5. Prefer `viking://resources/...` URIs in new workflows. The wrapper still
   accepts `ov:///...` as a compatibility alias.

## Notes

- Keep secrets in `container/.env`, not in the MCP config example
- Claude plugin setup is unchanged and remains documented in the existing
  getting-started flow
- Codex skill install and Codex MCP setup are both required for the full
  Codex experience
