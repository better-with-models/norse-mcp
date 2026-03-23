# nordic-mcp-status

Check the health of all nordic-mcp endpoints and report status.

## Steps

1. Check Docker container status:

   ```bash
   cd "$(git rev-parse --show-toplevel)/container" && docker compose ps
   ```

2. Check REST health endpoint:

   ```bash
   curl -s http://127.0.0.1:1933/health | python3 -m json.tool 2>/dev/null \
     || echo "REST health endpoint unreachable"
   ```

3. Check MCP endpoint handshake:

   ```bash
   curl -s -X POST http://127.0.0.1:1933/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"status-check","version":"0"}}}' \
     | python3 -m json.tool 2>/dev/null \
     || echo "MCP endpoint unreachable"
   ```

4. Check system info (requires API key in Authorization header):

   ```bash
   OPENVIKING_ROOT_API_KEY=$(grep OPENVIKING_ROOT_API_KEY \
     "$(git rev-parse --show-toplevel)/container/.env" \
     | cut -d= -f2)
   curl -s http://127.0.0.1:1933/api/v1/system/info \
     -H "Authorization: Bearer $OPENVIKING_ROOT_API_KEY" \
     | python3 -m json.tool 2>/dev/null \
     || echo "System info endpoint unreachable (check API key)"
   ```

## Healthy output example

```json
{ "status": "ok" }
```

```json
{ "jsonrpc": "2.0", "id": 1, "result": { "protocolVersion": "2024-11-05", ... } }
```

## If unhealthy

```bash
cd "$(git rev-parse --show-toplevel)/container"
docker compose logs nordic-mcp --tail=50
```

Run `/nordic-mcp-start` to restart the stack if containers are down.
