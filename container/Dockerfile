# syntax=docker/dockerfile:1.9

ARG OPENVIKING_VERSION=v0.2.9

# ── nordic-mcp: OpenViking + nginx + Node.js MCP server ──────────────────────
FROM ghcr.io/volcengine/openviking:${OPENVIKING_VERSION} AS openviking-mcp

# Base image is Debian 13 (trixie) — use apt-get
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        nodejs \
        npm \
        supervisor \
        curl \
    && rm -rf /var/lib/apt/lists/*

# nginx config (replaces global config — full worker/upstream/server block)
COPY mcp-server/nginx.conf /etc/nginx/nginx.conf

# supervisord config and entrypoint
COPY mcp-server/supervisord.conf /app/openviking-mcp/supervisord.conf
COPY mcp-server/start.sh         /usr/local/bin/start-openviking-mcp.sh

# Node.js MCP server — install deps at build time
COPY mcp-server/ /app/openviking-mcp/
RUN cd /app/openviking-mcp && npm ci --omit=dev

# OpenViking config template (rendered at startup by render-openviking-config.py)
COPY openviking/ov.conf.template.json /app/ov.conf.template.json

# Runtime patch overlay for the pinned OpenViking image
COPY openviking-overlay/ /tmp/openviking-overlay/

# Config render script (standalone: no volume mount required)
COPY scripts/ /app/scripts/

RUN python - <<'PY'
import shutil
import site
from pathlib import Path

targets = [Path(path) for path in site.getsitepackages() if path.endswith("site-packages")]
target = next((path for path in targets if path.exists()), None)
if target is None:
    raise SystemExit("site-packages directory not found in base image")

source = Path("/tmp/openviking-overlay/sitecustomize.py")
if not source.exists():
    raise SystemExit(f"overlay file not found: {source}")

shutil.copy2(source, target / "sitecustomize.py")
PY

RUN chmod +x /usr/local/bin/start-openviking-mcp.sh \
    && mkdir -p /tmp/nginx_client_body /tmp/nginx_proxy

ENV OPENVIKING_INTERNAL_PORT=1934
ENV OPENVIKING_MCP_INTERNAL_PORT=4050

EXPOSE 1933

ENTRYPOINT ["/usr/local/bin/start-openviking-mcp.sh"]
