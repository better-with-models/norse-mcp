#!/bin/sh
set -e

# Render openviking config (sets internal host/port from env)
python /app/scripts/render-openviking-config.py

# Ensure nginx tmp dirs exist for non-root operation
mkdir -p /tmp/nginx_client_body /tmp/nginx_proxy

exec /usr/bin/supervisord -c /app/openviking-mcp/supervisord.conf
