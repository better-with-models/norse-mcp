# CONCEPTS — nordic-mcp

Shared vocabulary used throughout this repository.

## Core terms

**OpenViking**
The vector-database server (Docker image `ghcr.io/volcengine/openviking`).
Provides a REST API for storing and searching embedded content.

**vikingDB**
The underlying storage engine used by OpenViking. Backed by LevelDB.
All data is stored at `$HOME/.nordic_mcp/openviking-data` by default.

**nordic-mcp**
This product. The Claude plugin + Docker stack that wraps OpenViking and
exposes it as an MCP server.

**MCP server**
The Model Context Protocol server running inside the container on internal
port 4050. Exposed publicly at `http://127.0.0.1:1933/mcp` via nginx.

**Collection**
A named namespace in the vector database. Each collection has its own
embedding space, metadata schema, and index.

**Pack**
A bundle of related content (documents, chunks) ingested together into
a collection.

**Session**
A scoped interaction context tracked by OpenViking across multiple MCP
tool calls. Sessions enable multi-turn workflows.

**Resource**
Any stored artifact in vikingDB: text chunks, file references, structured
records, or embeddings.

**Embedding model**
The model used to convert text to vectors. Configured via `OPENVIKING_EMBEDDING_MODEL`
in `container/.env`. Default: `text-embedding-3-large` (dimension 3072).

**VLM**
Vision-language model used for image understanding tasks. Configured via
`OPENVIKING_VLM_MODEL`. Default: `gpt-4-vision-preview`.

**nginx**
Reverse proxy inside the container. Routes port 1933 traffic to either
the REST API (port 1934) or the MCP server (port 4050) based on path.

**supervisord**
Process supervisor inside the container. Manages three processes:
`openviking-server`, `openviking-mcp`, and `nginx`.

## Document IDs

No controlled document ID scheme — this is an infrastructure product,
not an IMS. Files use descriptive names.

## Ports reference

| Port | Scope | Purpose |
|------|-------|---------|
| 1933 | public | nginx (REST + MCP) |
| 1934 | internal | OpenViking REST API |
| 4050 | internal | OpenViking MCP server |
