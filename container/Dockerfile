ARG OPENVIKING_VERSION=v0.2.9

# ── nordic-mcp image ─────────────────────────────────────────────────────────
# Single-stage image based on the official OpenViking release.
# Adds:
#   - nginx (reverse proxy: 1933 → REST 1934 + MCP 4050)
#   - Node.js + the nordic-mcp MCP server
#   - supervisord (process manager)
FROM ghcr.io/volcengine/openviking:${OPENVIKING_VERSION}

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# ── MCP server ───────────────────────────────────────────────────────────────
WORKDIR /app/mcp-server
COPY mcp-server/package.json mcp-server/package-lock.json* ./
RUN npm ci --omit=dev
COPY mcp-server/server.mjs ./
COPY mcp-server/src/ ./src/

# ── nginx config ─────────────────────────────────────────────────────────────
COPY mcp-server/nginx.conf /etc/nginx/sites-available/nordic-mcp
RUN ln -sf /etc/nginx/sites-available/nordic-mcp /etc/nginx/sites-enabled/nordic-mcp \
    && rm -f /etc/nginx/sites-enabled/default

# ── supervisord config ────────────────────────────────────────────────────────
COPY mcp-server/supervisord.conf /etc/supervisor/conf.d/nordic-mcp.conf

# ── OpenViking config template ────────────────────────────────────────────────
COPY openviking/ov.conf.template.json /app/ov.conf.template.json

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY mcp-server/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 1933

ENTRYPOINT ["/app/start.sh"]
