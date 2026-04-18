/**
 * Session routes — Create and manage orchestrator sessions.
 *
 * A session = sandbox + conversation + Gemini tools.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { SandboxClient } from '../sandbox/sandbox-client.js';
import type { McpProxy } from '../sandbox/mcp-proxy.js';
import type { WsManager } from '../ws/ws-manager.js';
import { sessionStore } from '../session/session-store.js';
import { mcpToolsToGeminiTools } from '../agent/tool-converter.js';
import type { SessionState } from '../session/types.js';

export interface SessionRouteDeps {
  sandboxClient: SandboxClient;
  mcpProxy: McpProxy;
  wsManager: WsManager;
}

const createSchema = z.object({
  repoUrl: z.string().url().optional(),
  repoBranch: z.string().optional(),
  env: z.record(z.string()).optional(),
});

export async function sessionRoutes(
  app: FastifyInstance,
  deps: SessionRouteDeps,
): Promise<void> {
  const { sandboxClient, mcpProxy, wsManager } = deps;

  /**
   * POST /api/sessions
   *
   * Creates a sandbox + session. Returns session info with tools.
   */
  app.post('/api/sessions', async (req, reply) => {
    const body = createSchema.parse(req.body ?? {});
    const sessionId = uuidv4();

    try {
      // Create sandbox via sandbox service
      const sandbox = await sandboxClient.createSandbox({
        repoUrl: body.repoUrl,
        repoBranch: body.repoBranch,
        env: body.env,
      });

      // List available MCP tools from the sandbox
      const mcpToolDefs = await mcpProxy.listTools(sandbox.mcpEndpoint);
      const geminiTools = mcpToolsToGeminiTools(mcpToolDefs);

      // Create session
      const session: SessionState = {
        id: sessionId,
        sandboxId: sandbox.id,
        mcpEndpoint: sandbox.mcpEndpoint,
        geminiTools,
        mcpToolDefs,
        messages: [],
        fileTree: [],
        createdAt: new Date(),
        status: 'ready',
      };

      sessionStore.set(sessionId, session);

      // Notify WebSocket subscribers
      wsManager.send(sessionId, {
        type: 'session_ready',
        sessionId,
        sandboxId: sandbox.id,
        tools: sandbox.tools,
      });

      return reply.status(201).send({
        sessionId,
        sandboxId: sandbox.id,
        mcpEndpoint: sandbox.mcpEndpoint,
        tools: mcpToolDefs.map((t) => ({ name: t.name, description: t.description })),
        status: 'ready',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: `Failed to create session: ${msg}` });
    }
  });

  /**
   * GET /api/sessions
   */
  app.get('/api/sessions', async (_req, reply) => {
    const sessions = sessionStore.list().map((s) => ({
      id: s.id,
      sandboxId: s.sandboxId,
      status: s.status,
      messageCount: s.messages.length,
      createdAt: s.createdAt.toISOString(),
    }));
    return reply.send({ sessions });
  });

  /**
   * GET /api/sessions/:id
   */
  app.get('/api/sessions/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const session = sessionStore.get(id);
    if (!session) return reply.status(404).send({ error: 'Session not found' });

    return reply.send({
      id: session.id,
      sandboxId: session.sandboxId,
      mcpEndpoint: session.mcpEndpoint,
      status: session.status,
      tools: session.mcpToolDefs.map((t) => ({ name: t.name, description: t.description })),
      messageCount: session.messages.length,
      fileTree: session.fileTree,
      createdAt: session.createdAt.toISOString(),
    });
  });

  /**
   * DELETE /api/sessions/:id
   */
  app.delete('/api/sessions/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const session = sessionStore.get(id);
    if (!session) return reply.status(404).send({ error: 'Session not found' });

    // Destroy sandbox
    try {
      await sandboxClient.destroySandbox(session.sandboxId);
    } catch {
      // Best effort
    }

    sessionStore.updateStatus(id, 'destroyed');
    sessionStore.delete(id);

    return reply.send({ status: 'destroyed' });
  });
}
