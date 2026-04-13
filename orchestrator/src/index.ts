/**
 * GTD Sandbox Service — Thin API that creates isolated Docker workspaces
 * with GTD MCP tools exposed over HTTP.
 *
 * The orchestrator (Lovable, V0, custom) calls this service to:
 *   1. POST /sandboxes → get an mcpEndpoint
 *   2. Call GTD tools directly on that endpoint
 *   3. DELETE /sandboxes/:id when done
 *
 * We don't own the LLM loop, prompt, or session — that's the orchestrator's job.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';

import { loadConfig } from './config.js';
import { SandboxService } from './sandbox/sandbox-service.js';
import { McpClient } from './mcp/mcp-client.js';
import { sandboxRoutes } from './routes/sandboxes.js';
import { healthRoutes } from './routes/health.js';

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

  // Services
  const sandboxService = new SandboxService(config);
  const mcpClient = new McpClient(config);

  // Routes
  await sandboxRoutes(app, { sandboxService, mcpClient });
  await healthRoutes(app, { mcpClient });

  // Start
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(`GTD Sandbox Service running on ${config.HOST}:${config.PORT}`);
  app.log.info(`Workspace image: ${config.WORKSPACE_IMAGE}`);

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
