import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpClient } from './mcp-client.js';
import type { Config } from '../config.js';

const testConfig: Config = {
  PORT: 3000,
  HOST: '0.0.0.0',
  NODE_ENV: 'test',
  DOCKER_SOCKET: '/var/run/docker.sock',
  WORKSPACE_IMAGE: 'gtd-workspace:latest',
  SANDBOX_CPU_LIMIT: 1,
  SANDBOX_MEMORY_LIMIT: '1g',
  MCP_BRIDGE_PORT: 3100,
  MCP_BRIDGE_TIMEOUT_MS: 5000,
};

describe('McpClient', () => {
  let client: McpClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    client = new McpClient(testConfig);
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('listTools()', () => {
    it('should POST to /mcp/tools/list and return tool definitions', async () => {
      const mockTools = [
        { name: 'gtd_scan', description: 'Scan project', inputSchema: {} },
        { name: 'gtd_analyze', description: 'Analyze specs', inputSchema: {} },
        { name: 'gtd_handover', description: 'Git handover', inputSchema: {} },
      ];

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ tools: mockTools }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const tools = await client.listTools('http://172.17.0.5:3100');

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://172.17.0.5:3100/mcp/tools/list',
        expect.objectContaining({
          method: 'POST',
          body: '{}',
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      expect(tools).toHaveLength(3);
      expect(tools[0].name).toBe('gtd_scan');
      expect(tools[2].name).toBe('gtd_handover');
    });

    it('should return empty array when no tools field', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      const tools = await client.listTools('http://172.17.0.5:3100');
      expect(tools).toEqual([]);
    });
  });

  describe('callTool()', () => {
    it('should POST tool name and arguments to /mcp/tools/call', async () => {
      const mockResult = {
        content: [{ type: 'text', text: 'Scan complete: 5 files found' }],
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResult), { status: 200 }),
      );

      const result = await client.callTool(
        'http://172.17.0.5:3100',
        'gtd_scan',
        { path: '/workspace' },
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://172.17.0.5:3100/mcp/tools/call',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'gtd_scan', arguments: { path: '/workspace' } }),
        }),
      );

      expect(result.content[0].text).toBe('Scan complete: 5 files found');
    });

    it('should handle error responses from tools', async () => {
      const mockResult = {
        content: [{ type: 'text', text: 'Error: file not found' }],
        isError: true,
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResult), { status: 200 }),
      );

      const result = await client.callTool('http://172.17.0.5:3100', 'gtd_read', { path: '/missing' });

      expect(result.isError).toBe(true);
    });

    it('should call gtd_handover tool with mode and remote_url', async () => {
      const mockResult = {
        content: [{ type: 'text', text: 'Pushed to https://github.com/test/repo on branch main' }],
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResult), { status: 200 }),
      );

      const result = await client.callTool(
        'http://172.17.0.5:3100',
        'gtd_handover',
        { mode: 'A', remote_url: 'https://github.com/test/repo.git' },
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://172.17.0.5:3100/mcp/tools/call',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'gtd_handover',
            arguments: { mode: 'A', remote_url: 'https://github.com/test/repo.git' },
          }),
        }),
      );

      expect(result.content[0].text).toContain('Pushed to');
    });

    it('should call gtd_handover with mode C (PR-ready)', async () => {
      const mockResult = {
        content: [{ type: 'text', text: 'Pushed to https://github.com/test/repo on branch gtd/feature-123' }],
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResult), { status: 200 }),
      );

      const result = await client.callTool(
        'http://172.17.0.5:3100',
        'gtd_handover',
        {
          mode: 'C',
          remote_url: 'https://github.com/test/repo.git',
          branch: 'gtd/feature-123',
          message: 'feat: add login page',
        },
      );

      const body = JSON.parse(
        (fetchSpy.mock.calls[0][1] as { body: string }).body,
      );
      expect(body.name).toBe('gtd_handover');
      expect(body.arguments.mode).toBe('C');
      expect(body.arguments.branch).toBe('gtd/feature-123');
      expect(body.arguments.message).toBe('feat: add login page');

      expect(result.content[0].text).toContain('gtd/feature-123');
    });
  });

  describe('health()', () => {
    it('should return health status from /mcp/health', async () => {
      const mockHealth = {
        alive: true,
        initialized: true,
        pid: 42,
        restartCount: 0,
        pendingRequests: 0,
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockHealth), { status: 200 }),
      );

      const health = await client.health('http://172.17.0.5:3100');

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://172.17.0.5:3100/mcp/health',
        expect.objectContaining({ method: 'GET' }),
      );

      expect(health.alive).toBe(true);
      expect(health.initialized).toBe(true);
    });

    it('should return not-alive status when bridge is down', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Connection refused'));

      const health = await client.health('http://172.17.0.5:3100');

      expect(health.alive).toBe(false);
      expect(health.initialized).toBe(false);
    });
  });

  describe('waitForReady()', () => {
    it('should resolve when bridge becomes initialized', async () => {
      // First call: not ready, second call: ready
      fetchSpy
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ alive: true, initialized: false }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ alive: true, initialized: true }), { status: 200 }),
        );

      await expect(client.waitForReady('http://172.17.0.5:3100', 5000)).resolves.toBeUndefined();
    });

    it('should throw after timeout if bridge never becomes ready', async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify({ alive: false, initialized: false }), { status: 200 }),
      );

      await expect(client.waitForReady('http://172.17.0.5:3100', 1500)).rejects.toThrow(
        'MCP bridge at http://172.17.0.5:3100 not ready within 1500ms',
      );
    });
  });
});
