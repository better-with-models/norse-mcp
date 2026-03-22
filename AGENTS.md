# AGENTS — nordic-mcp

## Repository overview

`nordic-mcp` is a documentation-first Claude plugin repository containing:

- **1 plugin** (`nordic-mcp`) registered in `.claude-plugin/`
- **1 skill** (`nordic-mcp-guide`) in `Skills/`
- **1 agent** (`nordic-mcp-orchestrator`) in `agents/`
- **4 slash commands** in `.claude/commands/`
- **Docker stack** in `container/` (OpenViking + nginx + Node.js MCP)

All runtime data is stored outside the repo at `$HOME/.nordic_mcp/`.

## Key directories

| Directory | Purpose |
|-----------|---------|
| `container/` | Docker build context — Dockerfile, compose file, MCP server source |
| `container/mcp-server/src/` | Node.js MCP tool modules (14 files, 40 tools) |
| `.claude-plugin/` | Plugin and marketplace metadata |
| `.claude/commands/` | Slash commands for start/stop/status/config |
| `Skills/nordic-mcp-guide/` | Complete skill for using the MCP server |
| `agents/` | Orchestrator agent |
| `docs/` | Human-facing documentation |
| `scripts/` | Validation and preflight scripts |

## Documentation invariants

Keep these values synchronized whenever you change them:

| Value | Files that must match |
|-------|-----------------------|
| Plugin version | `README.md`, `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `CHANGELOG.md` |
| Tool count | `README.md`, `AGENTS.md`, `Skills/nordic-mcp-guide/SKILL.md`, `docs/mcp-coverage-matrix.md` |
| OpenViking version | `container/Dockerfile`, `container/.env.example`, `Skills/nordic-mcp-guide/SKILL.md` |
| Public port | `container/docker-compose.yml`, `container/mcp-server/nginx.conf`, `.claude-plugin/plugin.json`, `docs/mcp-coverage-matrix.md` |

`AGENTS.md` is the authoritative guide for agents and automation.
Do not duplicate content between `AGENTS.md` and `README.md` — README is for
humans, AGENTS.md is for agents and CI.

## Docker stack

The full stack is one Docker Compose service (`nordic-mcp`) using a single image
built from `container/Dockerfile`. Internally it runs three processes via supervisord:

| Process | Internal port | External |
|---------|--------------|---------|
| openviking-server | 1934 | — |
| openviking-mcp | 4050 | — |
| nginx | — | 1933 (public) |

nginx routes:
- `GET /health` → openviking REST
- `POST /mcp` → MCP server
- All other paths → openviking REST

## Slash commands

| Command | Action |
|---------|--------|
| `/nordic-mcp-start` | `docker compose up -d`, poll health |
| `/nordic-mcp-stop` | `docker compose down` |
| `/nordic-mcp-status` | health check REST + MCP endpoints |
| `/nordic-mcp-config` | `.env` setup checklist |

## Running scripts

```bash
# Lint all Markdown
npm run lint

# Docker preflight (checks daemon, .env, port availability)
python scripts/preflight.py
```

## Editing rules

- Never commit `container/.env` — only `.env.example` is tracked.
- Do not store data files inside the repo — data lives in `$HOME/.nordic_mcp/`.
- Update `CHANGELOG.md` for every version bump.
- Prefer explicit version pins in `container/Dockerfile` and `container/mcp-server/package.json`.

## Escalation cues

Pause and confirm before:
- Changing the OpenViking version in `container/Dockerfile`
- Adding or removing MCP tools (requires SKILL.md and coverage matrix update)
- Changing the public port (1933) — coordinate with `.claude-plugin/plugin.json`
- Removing legacy compatibility aliases in `container/mcp-server/src/compat.mjs`
