# AGENTS — nordic-mcp/.github

This directory contains GitHub-side automation only.

See the repository root [`AGENTS.md`](../AGENTS.md) for all authoritative guidance on the
nordic-mcp plugin, Docker stack, MCP server, and documentation invariants.

## Workflows

| File | Trigger | Purpose |
|------|---------|---------|
| `workflows/ci.yml` | Every push / pull request | Lint Markdown, validate plugin JSON, run MCP server unit tests |
| `workflows/docker-publish.yml` | Push to `main` or `v*.*.*` tags | Build multi-arch Docker image and publish to GHCR |

## Secrets required

| Secret | Used by | Purpose |
|--------|---------|---------|
| `GITHUB_TOKEN` | `docker-publish.yml` | Authenticate with GitHub Container Registry (auto-provided) |

No other secrets are required. The Docker build does not need `OPENAI_API_KEY` or
`OPENVIKING_ROOT_API_KEY` at build time — those are runtime environment variables.
