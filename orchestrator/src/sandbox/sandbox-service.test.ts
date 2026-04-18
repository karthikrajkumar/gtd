import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Config } from '../config.js';

/**
 * SandboxService uses `require('dockerode')` at runtime, which bypasses vi.mock.
 * We test by mocking the constructor via vi.mock on the module path, but since
 * createRequire is used internally, we use a different approach:
 *
 * We test the service indirectly through its public API by overriding the
 * docker instance via Object.defineProperty after construction.
 */

const testConfig: Config = {
  PORT: 3000,
  HOST: '0.0.0.0',
  NODE_ENV: 'test',
  DOCKER_SOCKET: '/var/run/docker.sock',
  WORKSPACE_IMAGE: 'gtd-workspace:latest',
  SANDBOX_CPU_LIMIT: 1,
  SANDBOX_MEMORY_LIMIT: '1g',
  MCP_BRIDGE_PORT: 3100,
  MCP_BRIDGE_TIMEOUT_MS: 65000,
};

// Helper: build a mock Dockerode instance
function createMockDocker() {
  const mockStart = vi.fn().mockResolvedValue(undefined);
  const mockStop = vi.fn().mockResolvedValue(undefined);
  const mockRemove = vi.fn().mockResolvedValue(undefined);
  const mockInspect = vi.fn();
  const mockContainerExec = vi.fn();
  const mockExecStart = vi.fn();
  const mockExecInspect = vi.fn();

  const mockContainer = {
    id: 'container-abc123',
    start: mockStart,
    stop: mockStop,
    remove: mockRemove,
    inspect: mockInspect,
    exec: mockContainerExec,
  };

  const mockNetworkRemove = vi.fn().mockResolvedValue(undefined);
  const mockNetwork = { id: 'network-xyz', remove: mockNetworkRemove };

  const mockVolumeRemove = vi.fn().mockResolvedValue(undefined);

  const mockCreateContainer = vi.fn().mockResolvedValue(mockContainer);
  const mockCreateVolume = vi.fn().mockResolvedValue({ remove: mockVolumeRemove });
  const mockCreateNetwork = vi.fn().mockResolvedValue(mockNetwork);
  const mockGetContainer = vi.fn().mockReturnValue(mockContainer);
  const mockGetNetwork = vi.fn().mockReturnValue({ remove: mockNetworkRemove });
  const mockGetVolume = vi.fn().mockReturnValue({ remove: mockVolumeRemove });
  const mockListContainers = vi.fn();

  const dockerInstance = {
    createContainer: mockCreateContainer,
    createVolume: mockCreateVolume,
    createNetwork: mockCreateNetwork,
    getContainer: mockGetContainer,
    getNetwork: mockGetNetwork,
    getVolume: mockGetVolume,
    listContainers: mockListContainers,
    modem: { demuxStream: vi.fn() },
  };

  return {
    dockerInstance,
    mockContainer,
    mockStart,
    mockStop,
    mockRemove,
    mockInspect,
    mockContainerExec,
    mockExecStart,
    mockExecInspect,
    mockNetworkRemove,
    mockNetwork,
    mockVolumeRemove,
    mockCreateContainer,
    mockCreateVolume,
    mockCreateNetwork,
    mockGetContainer,
    mockGetNetwork,
    mockGetVolume,
    mockListContainers,
  };
}

// We need to patch the docker instance after construction
async function createServiceWithMockDocker(config: Config) {
  const { SandboxService } = await import('./sandbox-service.js');
  const service = new SandboxService(config);
  const mocks = createMockDocker();
  // Override the private docker property
  Object.defineProperty(service, 'docker', {
    value: mocks.dockerInstance,
    writable: true,
  });
  return { service, ...mocks };
}

// Mock uuid to return predictable IDs
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
}));

describe('SandboxService', () => {
  describe('create()', () => {
    it('should create a sandbox with volume, network, and container', async () => {
      const { service, mockCreateVolume, mockCreateNetwork, mockCreateContainer, mockStart, mockInspect } =
        await createServiceWithMockDocker(testConfig);

      mockInspect.mockResolvedValue({
        NetworkSettings: {
          Networks: {
            'gtd-net-a1b2c3d4': { IPAddress: '172.17.0.5' },
          },
        },
      });

      const result = await service.create();

      // Volume created
      expect(mockCreateVolume).toHaveBeenCalledWith({ Name: 'gtd-vol-a1b2c3d4' });

      // Network created
      expect(mockCreateNetwork).toHaveBeenCalledWith({
        Name: 'gtd-net-a1b2c3d4',
        Driver: 'bridge',
      });

      // Container created with security settings
      expect(mockCreateContainer).toHaveBeenCalledTimes(1);
      const containerOpts = mockCreateContainer.mock.calls[0][0];
      expect(containerOpts.Image).toBe('gtd-workspace:latest');
      expect(containerOpts.name).toBe('gtd-sandbox-a1b2c3d4');
      expect(containerOpts.HostConfig.CapDrop).toEqual(['ALL']);
      expect(containerOpts.HostConfig.SecurityOpt).toEqual(['no-new-privileges']);
      expect(containerOpts.HostConfig.Binds).toEqual(['gtd-vol-a1b2c3d4:/workspace']);
      expect(containerOpts.WorkingDir).toBe('/workspace');

      // Container started
      expect(mockStart).toHaveBeenCalled();

      // Returns correct info
      expect(result).toEqual({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        containerId: 'container-abc123',
        containerName: 'gtd-sandbox-a1b2c3d4',
        mcpEndpoint: 'http://172.17.0.5:3100',
        status: 'running',
      });
    });

    it('should pass repo URL as environment variable', async () => {
      const { service, mockInspect, mockCreateContainer } =
        await createServiceWithMockDocker(testConfig);

      mockInspect.mockResolvedValue({
        NetworkSettings: {
          Networks: { net: { IPAddress: '172.17.0.5' } },
        },
      });

      await service.create({
        repoUrl: 'https://github.com/test/repo.git',
        repoBranch: 'develop',
      });

      const containerOpts = mockCreateContainer.mock.calls[0][0];
      expect(containerOpts.Env).toContain('GTD_CLONE_URL=https://github.com/test/repo.git');
      expect(containerOpts.Env).toContain('GTD_CLONE_BRANCH=develop');
    });

    it('should pass custom env vars', async () => {
      const { service, mockInspect, mockCreateContainer } =
        await createServiceWithMockDocker(testConfig);

      mockInspect.mockResolvedValue({
        NetworkSettings: {
          Networks: { net: { IPAddress: '172.17.0.5' } },
        },
      });

      await service.create({
        env: { GIT_TOKEN: 'secret123', CUSTOM_VAR: 'value' },
      });

      const containerOpts = mockCreateContainer.mock.calls[0][0];
      expect(containerOpts.Env).toContain('GIT_TOKEN=secret123');
      expect(containerOpts.Env).toContain('CUSTOM_VAR=value');
    });

    it('should cleanup and throw if no IP assigned', async () => {
      const { service, mockInspect, mockStop, mockRemove, mockNetworkRemove } =
        await createServiceWithMockDocker(testConfig);

      mockInspect.mockResolvedValue({
        NetworkSettings: { Networks: {} },
      });

      await expect(service.create()).rejects.toThrow('Failed to get container IP');

      // Cleanup happened
      expect(mockStop).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalledWith({ v: true });
      expect(mockNetworkRemove).toHaveBeenCalled();
    });

    it('should set correct resource limits', async () => {
      const { service, mockInspect, mockCreateContainer } =
        await createServiceWithMockDocker(testConfig);

      mockInspect.mockResolvedValue({
        NetworkSettings: {
          Networks: { net: { IPAddress: '172.17.0.5' } },
        },
      });

      await service.create();

      const containerOpts = mockCreateContainer.mock.calls[0][0];
      expect(containerOpts.HostConfig.NanoCpus).toBe(1e9); // 1 CPU
      expect(containerOpts.HostConfig.Memory).toBe(1024 ** 3); // 1GB
      expect(containerOpts.HostConfig.MemorySwap).toBe(1024 ** 3); // No swap
    });
  });

  describe('destroy()', () => {
    it('should stop and remove running container, network, and volume', async () => {
      const { service, mockInspect, mockStop, mockRemove, mockGetContainer, mockGetNetwork, mockGetVolume } =
        await createServiceWithMockDocker(testConfig);

      mockInspect.mockResolvedValue({ State: { Running: true } });

      await service.destroy('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(mockGetContainer).toHaveBeenCalledWith('gtd-sandbox-a1b2c3d4');
      expect(mockStop).toHaveBeenCalledWith({ t: 5 });
      expect(mockRemove).toHaveBeenCalledWith({ v: true });
      expect(mockGetNetwork).toHaveBeenCalledWith('gtd-net-a1b2c3d4');
      expect(mockGetVolume).toHaveBeenCalledWith('gtd-vol-a1b2c3d4');
    });

    it('should skip stop if container is not running', async () => {
      const { service, mockInspect, mockStop, mockRemove } =
        await createServiceWithMockDocker(testConfig);

      mockInspect.mockResolvedValue({ State: { Running: false } });

      await service.destroy('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(mockStop).not.toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalledWith({ v: true });
    });

    it('should ignore 404 errors (already destroyed)', async () => {
      const { service, mockInspect } =
        await createServiceWithMockDocker(testConfig);

      const notFoundError = Object.assign(new Error('Not found'), { statusCode: 404 });
      mockInspect.mockRejectedValue(notFoundError);

      // Should not throw
      await expect(service.destroy('a1b2c3d4-xxxx')).resolves.toBeUndefined();
    });

    it('should re-throw non-404 errors', async () => {
      const { service, mockInspect } =
        await createServiceWithMockDocker(testConfig);

      const serverError = Object.assign(new Error('Server error'), { statusCode: 500 });
      mockInspect.mockRejectedValue(serverError);

      await expect(service.destroy('a1b2c3d4-xxxx')).rejects.toThrow('Server error');
    });
  });

  describe('get()', () => {
    it('should return sandbox info for running container', async () => {
      const { service, mockInspect } =
        await createServiceWithMockDocker(testConfig);

      mockInspect.mockResolvedValue({
        Id: 'full-container-id-abc',
        State: { Running: true },
        NetworkSettings: {
          Networks: { 'gtd-net': { IPAddress: '172.17.0.10' } },
        },
      });

      const result = await service.get('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(result).toEqual({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        containerId: 'full-container-id-abc',
        containerName: 'gtd-sandbox-a1b2c3d4',
        mcpEndpoint: 'http://172.17.0.10:3100',
        status: 'running',
      });
    });

    it('should return stopped status for non-running container', async () => {
      const { service, mockInspect } =
        await createServiceWithMockDocker(testConfig);

      mockInspect.mockResolvedValue({
        Id: 'full-container-id-abc',
        State: { Running: false },
        NetworkSettings: {
          Networks: { 'gtd-net': { IPAddress: '' } },
        },
      });

      const result = await service.get('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(result?.status).toBe('stopped');
      expect(result?.mcpEndpoint).toBe('');
    });

    it('should return null for 404 (sandbox not found)', async () => {
      const { service, mockInspect } =
        await createServiceWithMockDocker(testConfig);

      const notFoundError = Object.assign(new Error('Not found'), { statusCode: 404 });
      mockInspect.mockRejectedValue(notFoundError);

      const result = await service.get('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('list()', () => {
    it('should return all GTD sandbox containers', async () => {
      const { service, mockListContainers } =
        await createServiceWithMockDocker(testConfig);

      mockListContainers.mockResolvedValue([
        {
          Id: 'container-1',
          Names: ['/gtd-sandbox-abc12345'],
          State: 'running',
          NetworkSettings: {
            Networks: { net1: { IPAddress: '172.17.0.5' } },
          },
        },
        {
          Id: 'container-2',
          Names: ['/gtd-sandbox-def67890'],
          State: 'exited',
          NetworkSettings: {
            Networks: { net2: { IPAddress: '' } },
          },
        },
      ]);

      const result = await service.list();

      expect(mockListContainers).toHaveBeenCalledWith({
        all: true,
        filters: { name: ['gtd-sandbox-'] },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'abc12345',
        containerId: 'container-1',
        containerName: 'gtd-sandbox-abc12345',
        mcpEndpoint: 'http://172.17.0.5:3100',
        status: 'running',
      });
      expect(result[1]).toEqual({
        id: 'def67890',
        containerId: 'container-2',
        containerName: 'gtd-sandbox-def67890',
        mcpEndpoint: '',
        status: 'stopped',
      });
    });

    it('should return empty array when no sandboxes exist', async () => {
      const { service, mockListContainers } =
        await createServiceWithMockDocker(testConfig);

      mockListContainers.mockResolvedValue([]);

      const result = await service.list();
      expect(result).toEqual([]);
    });
  });
});
