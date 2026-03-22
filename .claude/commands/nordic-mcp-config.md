# nordic-mcp-config

Interactive checklist for configuring the nordic-mcp `.env` file before
starting the stack for the first time.

## Checklist

Work through each item in order. Check off each one as you complete it.

### 1. Copy the example file

```bash
cp "$(git rev-parse --show-toplevel)/nordic-mcp/container/.env.example" \
   "$(git rev-parse --show-toplevel)/nordic-mcp/container/.env"
```

### 2. Set the OpenViking root API key

Edit `container/.env` and set a strong random value for:

```
OPENVIKING_ROOT_API_KEY=<your-secret-here>
```

This key is required for all authenticated REST and MCP calls.

### 3. Set your OpenAI API key

```
OPENAI_API_KEY=sk-...
```

Required for embedding generation (`text-embedding-3-large`) and VLM calls.

### 4. (Optional) Adjust the data directory

The default stores data at `$HOME/.nordic_mcp/openviking-data`.
To change it, set:

```
NORDIC_MCP_DATA=/your/preferred/path
```

Ensure the path exists and is writable:

```bash
mkdir -p "$NORDIC_MCP_DATA"
```

### 5. (Optional) Change embedding model or dimensions

```
OPENVIKING_EMBEDDING_MODEL=text-embedding-3-large
OPENVIKING_EMBEDDING_DIM=3072
```

Note: changing the model after data is stored will break existing collections.

### 6. Verify the file

```bash
cat "$(git rev-parse --show-toplevel)/nordic-mcp/container/.env"
```

Confirm no placeholder values remain.

### 7. Run the preflight check

```bash
python "$(git rev-parse --show-toplevel)/nordic-mcp/scripts/preflight.py"
```

All checks should pass before running `/nordic-mcp-start`.
