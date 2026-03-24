# Changelog — nordic-mcp

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added

- Added a self-contained Codex-installable skill package at
  `codex/skills/nordic-mcp-guide`.
- Added Codex installation guidance in `docs/codex-install.md`.
- Added a reusable Codex MCP config example in
  `docs/examples/codex-mcp-config.json`.

### Changed

- Updated `README.md` and `docs/getting-started.md` to explain that Claude
  plugin installation and Codex installation use different client surfaces.
- Normalized legacy `ov:///...` URIs to `viking://resources/...` inside the MCP
  wrapper so compatibility aliases no longer hit invalid backend scopes.
- Updated the Claude and Codex usage docs to prefer `viking://resources/...`
  URIs and to reflect the live `ov_*` tool surface used by the server.
- Added a repo-owned OpenViking runtime patch overlay in the container image to
  sanitize non-finite search scores and prevent blank overview/abstract
  artifacts when using OpenAI-compatible local endpoints.
- Updated the setup and skill docs to clarify that `ov_content_abstract` and
  `ov_content_overview` read generated summary artifacts rather than generating
  them on demand.
- Fixed `ov_resources_create(target=...)` to translate to OpenViking's upstream
  `to` field, restoring direct-target ingest behavior.
- Moved LM Studio score sanitization earlier in the runtime path so invalid
  vector scores are filtered before they reach retriever candidate assembly.
- Updated the usage docs to prefer `target_uri` for `ov_search_find` and to use
  the returned `root_uri` for follow-up summary reads on single-document
  resources.

## [0.1.1] — 2026-03-23

### Changed

- Bumped the release metadata from `0.1.0` to `0.1.1` across the root package,
  plugin manifest, marketplace manifest, and README.
- Updated release notes for the 2026-03-23 patch release.

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
