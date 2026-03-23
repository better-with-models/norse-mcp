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

const client = createClient(Config);

const TOOL_REGS = [
  registerHealth, registerSystem, registerResources, registerSkills,
  registerPack, registerFilesystem, registerContent, registerSearch,
  registerRelations, registerSessions, registerTasks, registerObserver,
  registerAdmin, registerCompat,
];

/** Active sessions: sessionId → StreamableHTTPServerTransport */
const sessions = new Map();

const httpServer = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/mcp')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const sessionId = req.headers['mcp-session-id'];

  // Route an existing session
  if (sessionId) {
    const existing = sessions.get(sessionId);
    if (existing) {
      await existing.handleRequest(req, res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session not found' }));
    return;
  }

  // New session — create a fresh server + transport
  const sessionServer = new McpServer({ name: 'nordic-mcp', version: '2.0.0' });
  for (const reg of TOOL_REGS) reg(sessionServer, client, Config);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (id) => sessions.set(id, transport),
  });
  transport.onclose = () => {
    if (transport.sessionId) sessions.delete(transport.sessionId);
  };

  await sessionServer.connect(transport);
  await transport.handleRequest(req, res);
});
httpServer.listen(Config.mcpPort, '127.0.0.1', () =>
  console.log(`nordic-mcp listening on 127.0.0.1:${Config.mcpPort}`)
);
process.on('SIGTERM', () => httpServer.close(() => process.exit(0)));
