/**
 * GTD Test Orchestrator — Server entry point.
 *
 * A test harness to validate the sandbox service end-to-end:
 *   1. Create a sandbox (Docker container with GTD + MCP tools)
 *   2. Chat with Gemini to generate code using GTD tools
 *   3. View code in Monaco editor
 *   4. Handover to GitHub
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';

import { loadConfig } from './config.js';
import { SandboxClient } from './sandbox/sandbox-client.js';
import { McpProxy } from './sandbox/mcp-proxy.js';
import { WsManager } from './ws/ws-manager.js';
import { AgentLoop } from './agent/agent-loop.js';
import { sessionRoutes } from './routes/sessions.js';
import { chatRoutes } from './routes/chat.js';
import { fileRoutes } from './routes/files.js';

async function main(): Promise<void> {
  const config = loadConfig();

  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        config.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  // Services
  const sandboxClient = new SandboxClient(config);
  const mcpProxy = new McpProxy(config);
  const wsManager = new WsManager();
  const agentLoop = new AgentLoop(config, mcpProxy, sandboxClient, wsManager);

  // WebSocket chat handler — when users send chat via WS instead of REST
  wsManager.onChat((sessionId, content) => {
    agentLoop.run(sessionId, content).catch((err) => {
      console.error(`[ws-chat] Error in session ${sessionId}:`, err);
    });
  });

  // WebSocket endpoint
  app.get('/ws', { websocket: true }, (socket) => {
    wsManager.register(socket);
  });

  // HTTP Routes
  await sessionRoutes(app, { sandboxClient, mcpProxy, wsManager });
  await chatRoutes(app, { agentLoop });
  await fileRoutes(app, { sandboxClient });

  // Health check
  app.get('/api/health', async () => ({
    status: 'ok',
    service: 'gtd-test-orchestrator',
    timestamp: new Date().toISOString(),
  }));

  // Start
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(`GTD Test Orchestrator running on ${config.HOST}:${config.PORT}`);
  app.log.info(`Sandbox service: ${config.SANDBOX_SERVICE_URL}`);
  app.log.info(`Gemini model: ${config.GEMINI_MODEL}`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
