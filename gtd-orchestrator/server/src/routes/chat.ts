/**
 * Chat routes — Send messages and trigger the agent loop.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AgentLoop } from '../agent/agent-loop.js';
import { sessionStore } from '../session/session-store.js';

export interface ChatRouteDeps {
  agentLoop: AgentLoop;
}

const chatSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
});

export async function chatRoutes(
  app: FastifyInstance,
  deps: ChatRouteDeps,
): Promise<void> {
  const { agentLoop } = deps;

  /**
   * POST /api/sessions/:id/chat
   *
   * Sends a user message and triggers the agent loop.
   * Response is streamed via WebSocket. This endpoint returns immediately.
   */
  app.post('/api/sessions/:id/chat', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = chatSchema.parse(req.body);

    const session = sessionStore.get(id);
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    if (session.status === 'busy') {
      return reply.status(409).send({ error: 'Session is busy processing a previous message' });
    }
    if (session.status === 'destroyed') {
      return reply.status(410).send({ error: 'Session has been destroyed' });
    }

    // Fire and forget — results stream via WebSocket
    agentLoop.run(id, body.content).catch((err) => {
      console.error(`[agent-loop] Error in session ${id}:`, err);
    });

    return reply.status(202).send({
      status: 'processing',
      message: 'Message received. Responses will be streamed via WebSocket.',
    });
  });

  /**
   * GET /api/sessions/:id/messages
   *
   * Returns the full conversation history.
   */
  app.get('/api/sessions/:id/messages', async (req, reply) => {
    const { id } = req.params as { id: string };

    const session = sessionStore.get(id);
    if (!session) return reply.status(404).send({ error: 'Session not found' });

    return reply.send({ messages: session.messages });
  });
}
