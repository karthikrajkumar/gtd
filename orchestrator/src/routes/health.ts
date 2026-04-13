/**
 * Health routes — Service health check.
 */

import type { FastifyInstance } from 'fastify';
import type { McpClient } from '../mcp/mcp-client.js';

export interface HealthDeps {
  mcpClient: McpClient;
}

export async function healthRoutes(app: FastifyInstance, deps: HealthDeps): Promise<void> {
  app.get('/health', async (_req, reply) => {
    return reply.send({
      status: 'ok',
      service: 'gtd-sandbox-service',
      timestamp: new Date().toISOString(),
    });
  });
}
