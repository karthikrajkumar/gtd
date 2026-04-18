/**
 * Sandbox routes — The only API surface we expose.
 *
 * The orchestrator calls these to manage GTD workspaces.
 * All GTD tool calls go directly to the sandbox's mcpEndpoint.
 *
 * Flow:
 *   1. POST /sandboxes → { id, mcpEndpoint }
 *   2. Orchestrator calls mcpEndpoint/mcp/tools/call directly
 *   3. DELETE /sandboxes/:id when done
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { SandboxService } from '../sandbox/sandbox-service.js';
import type { McpClient } from '../mcp/mcp-client.js';

export interface SandboxRouteDeps {
  sandboxService: SandboxService;
  mcpClient: McpClient;
}

const createSchema = z.object({
  /** Clone a repo into /workspace (for backward pipeline / existing code) */
  repoUrl: z.string().url().optional(),
  repoBranch: z.string().optional(),
  /** Extra env vars (e.g. GIT_TOKEN for private repos) */
  env: z.record(z.string()).optional(),
});

export async function sandboxRoutes(
  app: FastifyInstance,
  deps: SandboxRouteDeps,
): Promise<void> {
  const { sandboxService, mcpClient } = deps;

  /**
   * POST /sandboxes
   *
   * Creates a sandbox with GTD installed and MCP bridge running.
   * Returns the mcpEndpoint URL — the orchestrator calls GTD tools
   * directly on this endpoint.
   *
   * Example response:
   * {
   *   "id": "a1b2c3d4-...",
   *   "mcpEndpoint": "http://172.17.0.5:3100",
   *   "tools": ["gtd_scan", "gtd_analyze", ...],
   *   "status": "ready"
   * }
   */
  app.post('/sandboxes', async (req, reply) => {
    const body = createSchema.parse(req.body ?? {});

    // Create container
    const sandbox = await sandboxService.create({
      repoUrl: body.repoUrl,
      repoBranch: body.repoBranch,
      env: body.env,
    });

    // Wait for MCP bridge to be ready
    await mcpClient.waitForReady(sandbox.mcpEndpoint);

    // If repo was requested, clone it
    if (body.repoUrl) {
      const cloneArgs = ['git', 'clone', '--depth', '1'];
      if (body.repoBranch) cloneArgs.push('--branch', body.repoBranch);
      cloneArgs.push(body.repoUrl, '.');

      const result = await sandboxService.exec(sandbox.id, cloneArgs, 60_000);
      if (result.exitCode !== 0) {
        // Cleanup on failure
        await sandboxService.destroy(sandbox.id);
        return reply.status(422).send({
          error: 'git clone failed',
          detail: result.stderr,
        });
      }

      // Set git identity for later commits
      await sandboxService.exec(sandbox.id, ['git', 'config', 'user.email', 'gtd@orchestrator']);
      await sandboxService.exec(sandbox.id, ['git', 'config', 'user.name', 'GTD Orchestrator']);
    } else {
      // Empty workspace — init git
      await sandboxService.exec(sandbox.id, ['git', 'init']);
      await sandboxService.exec(sandbox.id, ['git', 'config', 'user.email', 'gtd@orchestrator']);
      await sandboxService.exec(sandbox.id, ['git', 'config', 'user.name', 'GTD Orchestrator']);
    }

    // Fetch available tools
    let tools: string[] = [];
    try {
      const toolList = await mcpClient.listTools(sandbox.mcpEndpoint);
      tools = toolList.map((t) => t.name);
    } catch {
      // Non-critical — bridge may still be warming up
    }

    return reply.status(201).send({
      id: sandbox.id,
      mcpEndpoint: sandbox.mcpEndpoint,
      tools,
      status: 'ready',
    });
  });

  /**
   * GET /sandboxes/:id
   *
   * Sandbox info + MCP health.
   */
  app.get('/sandboxes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    const sandbox = await sandboxService.get(id);
    if (!sandbox) return reply.status(404).send({ error: 'Sandbox not found' });

    // Check MCP bridge health
    let mcpHealth = null;
    if (sandbox.status === 'running' && sandbox.mcpEndpoint) {
      try {
        mcpHealth = await mcpClient.health(sandbox.mcpEndpoint);
      } catch {
        mcpHealth = { alive: false, initialized: false };
      }
    }

    return reply.send({
      id: sandbox.id,
      mcpEndpoint: sandbox.mcpEndpoint,
      status: sandbox.status,
      mcpHealth,
    });
  });

  /**
   * GET /sandboxes
   *
   * List all active sandboxes.
   */
  app.get('/sandboxes', async (_req, reply) => {
    const sandboxes = await sandboxService.list();
    return reply.send({ sandboxes });
  });

  /**
   * POST /sandboxes/:id/exec
   *
   * Execute a command inside a sandbox container.
   * Used by the gtd-orchestrator for file browsing (find, cat).
   *
   * Body: { cmd: string[], timeoutMs?: number }
   */
  app.post('/sandboxes/:id/exec', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { cmd, timeoutMs } = req.body as { cmd: string[]; timeoutMs?: number };

    if (!Array.isArray(cmd) || cmd.length === 0) {
      return reply.status(400).send({ error: 'cmd must be a non-empty array of strings' });
    }

    const sandbox = await sandboxService.get(id);
    if (!sandbox) return reply.status(404).send({ error: 'Sandbox not found' });
    if (sandbox.status !== 'running') {
      return reply.status(409).send({ error: 'Sandbox is not running' });
    }

    const result = await sandboxService.exec(id, cmd, timeoutMs ?? 10_000);
    return reply.send(result);
  });

  /**
   * DELETE /sandboxes/:id
   *
   * Destroy sandbox — stops container, removes volume and network.
   */
  app.delete('/sandboxes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    const sandbox = await sandboxService.get(id);
    if (!sandbox) return reply.status(404).send({ error: 'Sandbox not found' });

    await sandboxService.destroy(id);

    return reply.send({ status: 'destroyed' });
  });
}
