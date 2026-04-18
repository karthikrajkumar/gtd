import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { sandboxRoutes } from './sandboxes.js';
import type { SandboxService, SandboxInfo } from '../sandbox/sandbox-service.js';
import type { McpClient } from '../mcp/mcp-client.js';

// --- Mock services ---

function createMockSandboxService(): SandboxService {
  return {
    create: vi.fn(),
    destroy: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
    exec: vi.fn(),
  } as unknown as SandboxService;
}

function createMockMcpClient(): McpClient {
  return {
    listTools: vi.fn(),
    callTool: vi.fn(),
    health: vi.fn(),
    waitForReady: vi.fn(),
  } as unknown as McpClient;
}

describe('Sandbox Routes', () => {
  let app: FastifyInstance;
  let sandboxService: ReturnType<typeof createMockSandboxService>;
  let mcpClient: ReturnType<typeof createMockMcpClient>;

  beforeEach(async () => {
    app = Fastify();
    sandboxService = createMockSandboxService();
    mcpClient = createMockMcpClient();
    await sandboxRoutes(app, { sandboxService, mcpClient });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /sandboxes', () => {
    it('should create a sandbox and return mcpEndpoint + tools', async () => {
      const mockSandbox: SandboxInfo = {
        id: 'test-id-1234',
        containerId: 'container-abc',
        containerName: 'gtd-sandbox-test-id-',
        mcpEndpoint: 'http://172.17.0.5:3100',
        status: 'running',
      };

      (sandboxService.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockSandbox);
      (mcpClient.waitForReady as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (sandboxService.exec as ReturnType<typeof vi.fn>).mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
      (mcpClient.listTools as ReturnType<typeof vi.fn>).mockResolvedValue([
        { name: 'gtd_scan', description: 'Scan', inputSchema: {} },
        { name: 'gtd_handover', description: 'Handover', inputSchema: {} },
      ]);

      const res = await app.inject({
        method: 'POST',
        url: '/sandboxes',
        payload: {},
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.id).toBe('test-id-1234');
      expect(body.mcpEndpoint).toBe('http://172.17.0.5:3100');
      expect(body.tools).toEqual(['gtd_scan', 'gtd_handover']);
      expect(body.status).toBe('ready');
    });

    it('should init git for empty workspace (no repoUrl)', async () => {
      const mockSandbox: SandboxInfo = {
        id: 'test-id-1234',
        containerId: 'container-abc',
        containerName: 'gtd-sandbox-test',
        mcpEndpoint: 'http://172.17.0.5:3100',
        status: 'running',
      };

      (sandboxService.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockSandbox);
      (mcpClient.waitForReady as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (sandboxService.exec as ReturnType<typeof vi.fn>).mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
      (mcpClient.listTools as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await app.inject({ method: 'POST', url: '/sandboxes', payload: {} });

      const execCalls = (sandboxService.exec as ReturnType<typeof vi.fn>).mock.calls;
      // Should call: git init, git config email, git config name
      expect(execCalls[0][1]).toEqual(['git', 'init']);
      expect(execCalls[1][1]).toEqual(['git', 'config', 'user.email', 'gtd@orchestrator']);
      expect(execCalls[2][1]).toEqual(['git', 'config', 'user.name', 'GTD Orchestrator']);
    });

    it('should clone repo when repoUrl is provided', async () => {
      const mockSandbox: SandboxInfo = {
        id: 'test-id-1234',
        containerId: 'container-abc',
        containerName: 'gtd-sandbox-test',
        mcpEndpoint: 'http://172.17.0.5:3100',
        status: 'running',
      };

      (sandboxService.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockSandbox);
      (mcpClient.waitForReady as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (sandboxService.exec as ReturnType<typeof vi.fn>).mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
      (mcpClient.listTools as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await app.inject({
        method: 'POST',
        url: '/sandboxes',
        payload: {
          repoUrl: 'https://github.com/test/repo.git',
          repoBranch: 'main',
        },
      });

      const execCalls = (sandboxService.exec as ReturnType<typeof vi.fn>).mock.calls;
      expect(execCalls[0][1]).toEqual([
        'git', 'clone', '--depth', '1', '--branch', 'main',
        'https://github.com/test/repo.git', '.',
      ]);
    });

    it('should return 422 and cleanup if git clone fails', async () => {
      const mockSandbox: SandboxInfo = {
        id: 'test-id-1234',
        containerId: 'container-abc',
        containerName: 'gtd-sandbox-test',
        mcpEndpoint: 'http://172.17.0.5:3100',
        status: 'running',
      };

      (sandboxService.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockSandbox);
      (mcpClient.waitForReady as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (sandboxService.exec as ReturnType<typeof vi.fn>).mockResolvedValue({
        exitCode: 128,
        stdout: '',
        stderr: 'fatal: repository not found',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/sandboxes',
        payload: { repoUrl: 'https://github.com/test/nonexistent.git' },
      });

      expect(res.statusCode).toBe(422);
      const body = JSON.parse(res.body);
      expect(body.error).toBe('git clone failed');
      expect(body.detail).toContain('repository not found');

      // Should have destroyed the sandbox
      expect(sandboxService.destroy).toHaveBeenCalledWith('test-id-1234');
    });

    it('should still return sandbox even if listTools fails', async () => {
      const mockSandbox: SandboxInfo = {
        id: 'test-id-1234',
        containerId: 'container-abc',
        containerName: 'gtd-sandbox-test',
        mcpEndpoint: 'http://172.17.0.5:3100',
        status: 'running',
      };

      (sandboxService.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockSandbox);
      (mcpClient.waitForReady as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (sandboxService.exec as ReturnType<typeof vi.fn>).mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
      (mcpClient.listTools as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('timeout'));

      const res = await app.inject({ method: 'POST', url: '/sandboxes', payload: {} });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.tools).toEqual([]); // Empty, not failed
    });
  });

  describe('GET /sandboxes/:id', () => {
    it('should return sandbox info with MCP health', async () => {
      (sandboxService.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'test-id',
        containerId: 'container-abc',
        containerName: 'gtd-sandbox-test',
        mcpEndpoint: 'http://172.17.0.5:3100',
        status: 'running',
      });
      (mcpClient.health as ReturnType<typeof vi.fn>).mockResolvedValue({
        alive: true,
        initialized: true,
        pid: 42,
        restartCount: 0,
        pendingRequests: 0,
      });

      const res = await app.inject({ method: 'GET', url: '/sandboxes/test-id' });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('running');
      expect(body.mcpHealth.alive).toBe(true);
    });

    it('should return 404 for non-existent sandbox', async () => {
      (sandboxService.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const res = await app.inject({ method: 'GET', url: '/sandboxes/nonexistent' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /sandboxes', () => {
    it('should return list of all sandboxes', async () => {
      (sandboxService.list as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'id-1',
          containerId: 'c1',
          containerName: 'gtd-sandbox-id-1',
          mcpEndpoint: 'http://172.17.0.5:3100',
          status: 'running',
        },
      ]);

      const res = await app.inject({ method: 'GET', url: '/sandboxes' });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.sandboxes).toHaveLength(1);
    });
  });

  describe('DELETE /sandboxes/:id', () => {
    it('should destroy sandbox and return status', async () => {
      (sandboxService.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'test-id',
        containerId: 'container-abc',
        containerName: 'gtd-sandbox-test',
        mcpEndpoint: 'http://172.17.0.5:3100',
        status: 'running',
      });
      (sandboxService.destroy as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const res = await app.inject({ method: 'DELETE', url: '/sandboxes/test-id' });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('destroyed');
      expect(sandboxService.destroy).toHaveBeenCalledWith('test-id');
    });

    it('should return 404 if sandbox does not exist', async () => {
      (sandboxService.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const res = await app.inject({ method: 'DELETE', url: '/sandboxes/nonexistent' });

      expect(res.statusCode).toBe(404);
    });
  });
});
