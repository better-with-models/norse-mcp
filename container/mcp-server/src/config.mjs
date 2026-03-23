// ── OpenViking MCP — configuration ────────────────────────────────────────────
// Resolved once from environment variables at startup.

export const Config = Object.freeze({
  ovBase:   `http://127.0.0.1:${process.env.OPENVIKING_INTERNAL_PORT ?? '1934'}`,
  ovKey:    process.env.OPENVIKING_ROOT_API_KEY ?? '',
  mcpPort:  parseInt(process.env.OPENVIKING_MCP_INTERNAL_PORT ?? '4050', 10),
  collPath: process.env.OPENVIKING_COLLECTION_PATH ?? '/',
});
