/**
 * MCP Client — HTTP client for the MCP bridge inside sandbox containers.
 *
 * Used by the sandbox service to verify bridge readiness,
 * and available for the orchestrator to call GTD tools.
 */

import type { Config } from '../config.js';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export interface McpHealthStatus {
  alive: boolean;
  initialized: boolean;
  pid: number | null;
  restartCount: number;
  pendingRequests: number;
}

export class McpClient {
  private timeoutMs: number;

  constructor(config: Config) {
    this.timeoutMs = config.MCP_BRIDGE_TIMEOUT_MS;
  }

  async listTools(endpoint: string): Promise<McpToolDefinition[]> {
    const res = await this.fetch(`${endpoint}/mcp/tools/list`, { method: 'POST', body: '{}' });
    const data = (await res.json()) as { tools?: McpToolDefinition[] };
    return data.tools ?? [];
  }

  async callTool(endpoint: string, name: string, args: Record<string, unknown> = {}): Promise<McpToolResult> {
    const res = await this.fetch(`${endpoint}/mcp/tools/call`, {
      method: 'POST',
      body: JSON.stringify({ name, arguments: args }),
    });
    return (await res.json()) as McpToolResult;
  }

  async health(endpoint: string): Promise<McpHealthStatus> {
    try {
      const res = await this.fetch(`${endpoint}/mcp/health`, { method: 'GET' });
      return (await res.json()) as McpHealthStatus;
    } catch {
      return { alive: false, initialized: false, pid: null, restartCount: 0, pendingRequests: 0 };
    }
  }

  async waitForReady(endpoint: string, maxWaitMs = 15_000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      try {
        const status = await this.health(endpoint);
        if (status.initialized) return;
      } catch { /* not up yet */ }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`MCP bridge at ${endpoint} not ready within ${maxWaitMs}ms`);
  }

  private async fetch(url: string, init: { method: string; body?: string }): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await globalThis.fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
