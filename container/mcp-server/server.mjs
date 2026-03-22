/**
 * nordic-mcp MCP server
 * Exposes 40 OpenViking tools via the Model Context Protocol.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'http';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { config } from './src/config.mjs';
import { healthTools, handleHealth } from './src/health.mjs';
import { systemTools, handleSystem } from './src/system.mjs';
import { resourceTools, handleResources } from './src/resources.mjs';
import { skillTools, handleSkills } from './src/skills.mjs';
import { packTools, handlePack } from './src/pack.mjs';
import { filesystemTools, handleFilesystem } from './src/filesystem.mjs';
import { contentTools, handleContent } from './src/content.mjs';
import { searchTools, handleSearch } from './src/search.mjs';
import { relationTools, handleRelations } from './src/relations.mjs';
import { sessionTools, handleSessions } from './src/sessions.mjs';
import { taskTools, handleTasks } from './src/tasks.mjs';
import { observerTools, handleObserver } from './src/observer.mjs';
import { adminTools, handleAdmin } from './src/admin.mjs';
import { compatTools, handleCompat } from './src/compat.mjs';

const ALL_TOOLS = [
  ...healthTools,
  ...systemTools,
  ...resourceTools,
  ...skillTools,
  ...packTools,
  ...filesystemTools,
  ...contentTools,
  ...searchTools,
  ...relationTools,
  ...sessionTools,
  ...taskTools,
  ...observerTools,
  ...adminTools,
  ...compatTools,
];

async function handleToolCall(name, args) {
  if (healthTools.find((t) => t.name === name)) return handleHealth(name, args);
  if (systemTools.find((t) => t.name === name)) return handleSystem(name, args);
  if (resourceTools.find((t) => t.name === name)) return handleResources(name, args);
  if (skillTools.find((t) => t.name === name)) return handleSkills(name, args);
  if (packTools.find((t) => t.name === name)) return handlePack(name, args);
  if (filesystemTools.find((t) => t.name === name)) return handleFilesystem(name, args);
  if (contentTools.find((t) => t.name === name)) return handleContent(name, args);
  if (searchTools.find((t) => t.name === name)) return handleSearch(name, args);
  if (relationTools.find((t) => t.name === name)) return handleRelations(name, args);
  if (sessionTools.find((t) => t.name === name)) return handleSessions(name, args);
  if (taskTools.find((t) => t.name === name)) return handleTasks(name, args);
  if (observerTools.find((t) => t.name === name)) return handleObserver(name, args);
  if (adminTools.find((t) => t.name === name)) return handleAdmin(name, args);
  if (compatTools.find((t) => t.name === name)) return handleCompat(name, args);
  throw new Error(`Unknown tool: ${name}`);
}

function createMcpServer() {
  const server = new Server(
    { name: 'nordic-mcp', version: '2.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const result = await handleToolCall(name, args ?? {});
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  });

  return server;
}

async function main() {
  const port = parseInt(process.env.MCP_PORT ?? '4050', 10);

  // HTTP transport (StreamableHTTP — used by nginx proxy)
  const httpServer = createServer();
  const transport = new StreamableHTTPServerTransport({ path: '/mcp' });
  const server = createMcpServer();
  await server.connect(transport);

  httpServer.on('request', transport.requestHandler);
  httpServer.listen(port, '127.0.0.1', () => {
    console.log(`nordic-mcp MCP server listening on http://127.0.0.1:${port}/mcp`);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
