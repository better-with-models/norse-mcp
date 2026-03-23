# nordic-mcp-stop

Stop the nordic-mcp Docker stack.

## Steps

1. Change into the container directory:

   ```bash
   cd "$(git rev-parse --show-toplevel)/nordic-mcp/container"
   ```

2. Stop and remove containers (data in `$HOME/.nordic_mcp/` is preserved):

   ```bash
   docker compose down
   ```

3. Confirm containers are gone:

   ```bash
   docker compose ps
   ```

## Expected output

```text
WARN[0000] ...
NAME    IMAGE   COMMAND   SERVICE   CREATED   STATUS    PORTS
```

(empty table — no running containers)

## Note

`docker compose down` does **not** delete the data volume at `$HOME/.nordic_mcp/`.
To wipe stored data entirely, delete that directory manually after stopping the stack.
