/**
 * MCP Proxy — forwards tool calls to a sandbox's MCP endpoint.
 *
 * Wraps HTTP calls to the per-sandbox MCP bridge.
 */

import type { Config } from '../config.js';
import type { McpToolDefinition } from '../session/types.js';

export interface McpToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export class McpProxy {
  private timeoutMs: number;

  constructor(config: Config) {
    this.timeoutMs = config.MCP_TOOL_TIMEOUT_MS;
  }

  async listTools(endpoint: string): Promise<McpToolDefinition[]> {
    const res = await this.fetch(`${endpoint}/mcp/tools/list`, {
      method: 'POST',
      body: '{}',
    });
    const data = (await res.json()) as { tools?: McpToolDefinition[] };
    return data.tools ?? [];
  }

  async callTool(
    endpoint: string,
    name: string,
    args: Record<string, unknown> = {},
  ): Promise<McpToolResult> {
    const res = await this.fetch(`${endpoint}/mcp/tools/call`, {
      method: 'POST',
      body: JSON.stringify({ name, arguments: args }),
    });
    return (await res.json()) as McpToolResult;
  }

  async health(endpoint: string): Promise<{ alive: boolean; initialized: boolean }> {
    try {
      const res = await this.fetch(`${endpoint}/mcp/health`, { method: 'GET' });
      return (await res.json()) as { alive: boolean; initialized: boolean };
    } catch {
      return { alive: false, initialized: false };
    }
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
