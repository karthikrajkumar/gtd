/**
 * HTTP client for the sandbox service (orchestrator/).
 *
 * Calls the REST API to create/destroy sandboxes and exec commands.
 */

import type { Config } from '../config.js';

export interface SandboxCreateResponse {
  id: string;
  mcpEndpoint: string;
  tools: string[];
  status: string;
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export class SandboxClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: Config) {
    this.baseUrl = config.SANDBOX_SERVICE_URL;
    this.timeoutMs = config.MCP_TOOL_TIMEOUT_MS;
  }

  async createSandbox(opts?: {
    repoUrl?: string;
    repoBranch?: string;
    env?: Record<string, string>;
  }): Promise<SandboxCreateResponse> {
    const res = await this.fetch('/sandboxes', {
      method: 'POST',
      body: JSON.stringify(opts ?? {}),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create sandbox: ${res.status} ${err}`);
    }
    return (await res.json()) as SandboxCreateResponse;
  }

  async destroySandbox(id: string): Promise<void> {
    const res = await this.fetch(`/sandboxes/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Failed to destroy sandbox: ${res.status}`);
    }
  }

  async getSandbox(id: string): Promise<{ id: string; mcpEndpoint: string; status: string; mcpHealth: unknown } | null> {
    const res = await this.fetch(`/sandboxes/${id}`, { method: 'GET' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to get sandbox: ${res.status}`);
    return (await res.json()) as { id: string; mcpEndpoint: string; status: string; mcpHealth: unknown };
  }

  /**
   * Execute a command inside a sandbox container.
   * Used for file browsing (find, cat).
   */
  async exec(sandboxId: string, cmd: string[], timeoutMs?: number): Promise<ExecResult> {
    const res = await this.fetch(`/sandboxes/${sandboxId}/exec`, {
      method: 'POST',
      body: JSON.stringify({ cmd, timeoutMs: timeoutMs ?? 10000 }),
    });
    if (!res.ok) {
      throw new Error(`Exec failed: ${res.status}`);
    }
    return (await res.json()) as ExecResult;
  }

  private async fetch(path: string, init: { method: string; body?: string }): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await globalThis.fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
