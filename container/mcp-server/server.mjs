import http from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { Config }                          from './src/config.mjs';
import { createClient }                    from './src/client.mjs';
import { register as registerHealth }      from './src/tools/health.mjs';
import { register as registerSystem }      from './src/tools/system.mjs';
import { register as registerResources }   from './src/tools/resources.mjs';
import { register as registerSkills }      from './src/tools/skills.mjs';
import { register as registerPack }        from './src/tools/pack.mjs';
import { register as registerFilesystem }  from './src/tools/filesystem.mjs';
import { register as registerContent }     from './src/tools/content.mjs';
import { register as registerSearch }      from './src/tools/search.mjs';
import { register as registerRelations }   from './src/tools/relations.mjs';
import { register as registerSessions }    from './src/tools/sessions.mjs';
import { register as registerTasks }       from './src/tools/tasks.mjs';
import { register as registerObserver }    from './src/tools/observer.mjs';
import { register as registerAdmin }       from './src/tools/admin.mjs';
import { register as registerCompat }      from './src/tools/compat.mjs';

const server = new McpServer({ name: 'nordic-mcp', version: '2.0.0' });
const client = createClient(Config);

for (const reg of [
  registerHealth,
  registerSystem,
  registerResources,
  registerSkills,
  registerPack,
  registerFilesystem,
  registerContent,
  registerSearch,
  registerRelations,
  registerSessions,
  registerTasks,
  registerObserver,
  registerAdmin,
  registerCompat,
]) {
  reg(server, client, Config);
}

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
});

const httpServer = http.createServer(async (req, res) => {
  if (req.url?.startsWith('/mcp')) {
    await transport.handleRequest(req, res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

await server.connect(transport);
httpServer.listen(Config.mcpPort, '127.0.0.1', () =>
  console.log(`nordic-mcp listening on 127.0.0.1:${Config.mcpPort}`)
);
process.on('SIGTERM', () => httpServer.close(() => process.exit(0)));
