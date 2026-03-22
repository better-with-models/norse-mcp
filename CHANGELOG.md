# Changelog — nordic-mcp

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.1.0] — 2026-03-22

### Added

- Initial scaffold of `nordic-mcp` as a domain-agnostic Claude plugin and
  single-plugin marketplace built on OpenViking v0.2.9.
- `container/` — Docker stack (Dockerfile, docker-compose.yml, .env.example,
  ov.conf.template.json, nginx.conf, supervisord.conf, start.sh).
- `container/mcp-server/` — Node.js MCP server exposing 40 tools across 13
  families via `@modelcontextprotocol/sdk`.
- `.claude-plugin/plugin.json` and `marketplace.json` — plugin and marketplace
  registration.
- `.claude/commands/` — four slash commands: start, stop, status, config.
- `Skills/nordic-mcp-guide/` — complete skill covering REST API patterns,
  MCP tool reference, session lifecycle, and guardrails.
- `agents/nordic-mcp-orchestrator.md` — routing agent for start/stop/status/use.
- `docs/` — index, getting-started walkthrough, and 40-tool coverage matrix.
- `scripts/preflight.py` — Docker daemon, `.env`, and port availability checks.
- `AGENTS.md`, `CONCEPTS.md`, `CLAUDE.md` — repository guidance.
- `package.json` with markdownlint-cli2 for Markdown validation.
- Runtime data directory: `$HOME/.nordic_mcp/openviking-data`.
