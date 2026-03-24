# nordic-mcp

Domain-agnostic OpenViking vector-database Claude plugin and single-plugin marketplace.

| Field | Value |
|-------|-------|
| Plugin ID | `nordic-mcp` |
| Version | 0.1.1 |
| MCP server | OpenViking v0.2.9 via Docker |
| Public port | 1933 |
| Data directory | `$HOME/.nordic_mcp/` |
| Format | Markdown + Node.js + Docker |

## What this plugin provides

- **40 MCP tools** across 13 families (health, system, resources, items, pack,
  filesystem, content, search, relations, sessions, tasks, observer, admin)
- **Single Docker service** — OpenViking REST API + MCP server + nginx reverse
  proxy, all co-located in one container on port 1933
- **Persistent vector storage** — LevelDB-backed collections stored outside the
  repo at `$HOME/.nordic_mcp/openviking-data`
- **Claude plugin + marketplace** — install directly from `.claude-plugin/`
- **Codex skill + MCP setup** — install the Codex skill from `codex/skills/`
  and configure Codex MCP separately

## Quick start

```bash
# 1. Configure
cp container/.env.example container/.env
# edit container/.env — set OPENVIKING_ROOT_API_KEY and OPENAI_API_KEY

# 2. Start
cd container && docker compose up -d

# 3. Verify
curl http://127.0.0.1:1933/health
# → {"status":"ok"}
```

Or use the slash command from within Claude: `/nordic-mcp-start`

## URI note

The native OpenViking resource scope is `viking://resources/...`.

- Prefer `viking://resources/...` in new examples and automation
- The older `ov:///...` form is still accepted by the MCP wrapper as a
  compatibility alias and is translated into `viking://resources/...`

## Codex

Codex installation is separate from Claude plugin installation:

- Install the Codex skill from `codex/skills/nordic-mcp-guide`
- Configure Codex MCP to connect to `http://127.0.0.1:1933/mcp` using
  `npx mcp-remote`

See [docs/codex-install.md](docs/codex-install.md) for GitHub and local install
paths.

## Repository layout

```text
nordic-mcp/
├── README.md                    # this file
├── AGENTS.md                    # agent and automation guidance
├── CLAUDE.md                    # stub → AGENTS.md
├── CONCEPTS.md                  # shared vocabulary
├── CHANGELOG.md                 # release history
├── package.json                 # markdownlint-cli2, lint script
├── .markdownlint-cli2.jsonc
│
├── .claude-plugin/              # Claude plugin + marketplace metadata
│   ├── plugin.json
│   └── marketplace.json
│
├── .claude/commands/            # slash commands
│   ├── nordic-mcp-start.md
│   ├── nordic-mcp-stop.md
│   ├── nordic-mcp-status.md
│   └── nordic-mcp-config.md
│
├── container/                   # Docker stack
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── openviking/
│   │   └── ov.conf.template.json
│   └── mcp-server/              # Node.js MCP server
│       ├── server.mjs
│       ├── package.json
│       ├── nginx.conf
│       ├── supervisord.conf
│       ├── start.sh
│       └── src/                 # 14 tool-family modules
│
├── Skills/
│   └── nordic-mcp-guide/        # complete usage skill
├── codex/
│   └── skills/
│       └── nordic-mcp-guide/    # self-contained Codex-installable skill
│
├── agents/
│   └── nordic-mcp-orchestrator.md
│
├── docs/
│   ├── index.md
│   ├── getting-started.md
│   └── mcp-coverage-matrix.md   # 40 tools → REST endpoint map
│
└── scripts/
    └── preflight.py             # docker + env sanity checks
```

## Validation

```bash
npm run lint    # markdownlint-cli2 on all Markdown files
```

## See also

- [AGENTS.md](AGENTS.md) — automation guidance
- [CONCEPTS.md](CONCEPTS.md) — vocabulary
- [docs/codex-install.md](docs/codex-install.md) — Codex skill + MCP setup
- [docs/getting-started.md](docs/getting-started.md) — first-use walkthrough
- [docs/mcp-coverage-matrix.md](docs/mcp-coverage-matrix.md) — full tool reference
