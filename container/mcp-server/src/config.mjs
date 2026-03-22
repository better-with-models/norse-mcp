/**
 * Configuration loaded from environment variables.
 * All values are set by supervisord from the Docker environment.
 */
export const config = {
  baseUrl: process.env.OPENVIKING_BASE_URL ?? 'http://127.0.0.1:1934',
  apiKey: process.env.OPENVIKING_ROOT_API_KEY ?? '',
  mcpPort: parseInt(process.env.MCP_PORT ?? '4050', 10),
};
