#!/bin/sh
set -e

# Render ov.conf.json from template by substituting environment variables
envsubst < /app/ov.conf.template.json > /app/ov.conf.json

# Ensure data directory exists
mkdir -p "$OPENVIKING_DATA"

echo "Starting nordic-mcp stack..."
echo "  OpenViking REST: http://127.0.0.1:1934"
echo "  OpenViking MCP:  http://127.0.0.1:4050"
echo "  nginx (public):  http://0.0.0.0:1933"
echo "  Data directory:  $OPENVIKING_DATA"

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/nordic-mcp.conf
