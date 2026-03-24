# nordic-mcp-status

Check the health of all nordic-mcp endpoints and report status.

## Steps

1. Check Docker container status:

   ```bash
   cd "$(git rev-parse --show-toplevel)/container" && docker compose ps
   ```

2. Check REST health endpoint:

   ```bash
   curl -s http://127.0.0.1:1933/health \
     || echo "REST health endpoint unreachable"
   ```

3. Check MCP endpoint handshake:

   ```bash
   result=$(curl -s -X POST http://127.0.0.1:1933/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"status-check","version":"0"}}}')
   echo "$result" | grep '^data:' | sed 's/^data: //' \
     || echo "MCP endpoint unreachable"
   ```

4. Confirm health detail:

   ```bash
   curl -s http://127.0.0.1:1933/health || echo "Health endpoint unreachable"
   ```

## Healthy output example

```json
{"status":"ok","healthy":true,"version":"v0.2.9","user_id":"default"}
```

```json
{"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"nordic-mcp","version":"2.0.0"}},"jsonrpc":"2.0","id":1}
```

## If unhealthy

> **Windows note:** `python3` may resolve to a Microsoft Store placeholder.
> The commands above do not depend on `python3`. If you need JSON formatting,
> use `python` instead of `python3`.

```bash
cd "$(git rev-parse --show-toplevel)/container"
docker compose logs nordic-mcp --tail=50
```

Run `/nordic-mcp-start` to restart the stack if containers are down.
