# nordic-mcp-start

Start the nordic-mcp Docker stack and verify all endpoints are healthy.

## Steps

1. Change into the container directory:

   ```bash
   cd "$(git rev-parse --show-toplevel)/nordic-mcp/container"
   ```

2. Confirm `.env` exists (not just `.env.example`):

   ```bash
   test -f .env || echo "ERROR: .env missing — run /nordic-mcp-config first"
   ```

3. Start the stack in detached mode:

   ```bash
   docker compose up -d --build
   ```

4. Poll the health endpoint until it responds (up to 30 s):

   ```bash
   for i in $(seq 1 15); do
     status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:1933/health 2>/dev/null)
     if [ "$status" = "200" ]; then
       echo "nordic-mcp is healthy (attempt $i)"
       break
     fi
     echo "Waiting... ($i/15)"
     sleep 2
   done
   ```

5. Confirm MCP endpoint responds:

   ```bash
   curl -s -o /dev/null -w "MCP endpoint: %{http_code}\n" \
     -X POST http://127.0.0.1:1933/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0"}}}'
   ```

## Expected output

```
nordic-mcp is healthy (attempt N)
MCP endpoint: 200
```

## If unhealthy

Run `/nordic-mcp-status` for detailed diagnostics, or check logs:

```bash
cd container && docker compose logs nordic-mcp
```
