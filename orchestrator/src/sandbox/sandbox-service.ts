/**
 * Sandbox Service — Docker container lifecycle for GTD workspaces.
 *
 * Stateless. Each sandbox is a Docker container with:
 *   - GTD framework installed
 *   - MCP bridge exposing GTD tools over HTTP
 *   - Isolated volume at /workspace
 *
 * The orchestrator creates sandboxes, gets back an mcpEndpoint URL,
 * and calls GTD tools directly on that endpoint.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
// Dockerode types use `export =`, which has no default export.
// Use a typed require-style workaround for ESM compatibility.
import type DockerodeType from 'dockerode';
const Dockerode: typeof DockerodeType = require('dockerode');
import { v4 as uuidv4 } from 'uuid';
import type { Config } from '../config.js';

export interface SandboxInfo {
  id: string;
  containerId: string;
  containerName: string;
  mcpEndpoint: string;
  status: 'running' | 'stopped' | 'not_found';
}

export interface CreateSandboxOptions {
  /** Clone a git repo into /workspace on startup */
  repoUrl?: string;
  repoBranch?: string;
  /** Extra env vars to inject (e.g. tokens for private repos) */
  env?: Record<string, string>;
}

export class SandboxService {
  private docker: InstanceType<typeof Dockerode>;

  constructor(private config: Config) {
    this.docker = new Dockerode({ socketPath: config.DOCKER_SOCKET });
  }

  /**
   * Create a new sandbox. Returns the MCP endpoint the orchestrator
   * should use to call GTD tools.
   */
  async create(opts: CreateSandboxOptions = {}): Promise<SandboxInfo> {
    const id = uuidv4();
    const shortId = id.slice(0, 8);
    const containerName = `gtd-sandbox-${shortId}`;

    // Build env vars
    const env = [
      `GTD_PROJECT=/workspace`,
      `MCP_BRIDGE_PORT=${this.config.MCP_BRIDGE_PORT}`,
    ];

    if (opts.repoUrl) {
      env.push(`GTD_CLONE_URL=${opts.repoUrl}`);
      if (opts.repoBranch) env.push(`GTD_CLONE_BRANCH=${opts.repoBranch}`);
    }

    if (opts.env) {
      for (const [k, v] of Object.entries(opts.env)) {
        env.push(`${k}=${v}`);
      }
    }

    // Create volume
    const volumeName = `gtd-vol-${shortId}`;
    await this.docker.createVolume({ Name: volumeName });

    // Create network
    const networkName = `gtd-net-${shortId}`;
    const network = await this.docker.createNetwork({
      Name: networkName,
      Driver: 'bridge',
    });

    const memoryBytes = parseMemoryLimit(this.config.SANDBOX_MEMORY_LIMIT);

    // Create container
    const container = await this.docker.createContainer({
      Image: this.config.WORKSPACE_IMAGE,
      name: containerName,
      Env: env,
      ExposedPorts: { [`${this.config.MCP_BRIDGE_PORT}/tcp`]: {} },
      HostConfig: {
        Binds: [`${volumeName}:/workspace`],
        NetworkMode: network.id,
        NanoCpus: Math.floor(this.config.SANDBOX_CPU_LIMIT * 1e9),
        Memory: memoryBytes,
        MemorySwap: memoryBytes,
        SecurityOpt: ['no-new-privileges'],
        CapDrop: ['ALL'],
        CapAdd: ['CHOWN', 'SETUID', 'SETGID', 'DAC_OVERRIDE'],
      },
      WorkingDir: '/workspace',
    });

    await container.start();

    // Get container IP
    const inspection = await container.inspect();
    const networks = inspection.NetworkSettings.Networks as Record<
      string,
      { IPAddress: string } | undefined
    >;
    const net = Object.values(networks)[0];
    const ip = net?.IPAddress;

    if (!ip) {
      await container.stop();
      await container.remove({ v: true });
      await network.remove();
      throw new Error('Failed to get container IP');
    }

    return {
      id,
      containerId: container.id,
      containerName,
      mcpEndpoint: `http://${ip}:${this.config.MCP_BRIDGE_PORT}`,
      status: 'running',
    };
  }

  /**
   * Destroy a sandbox: stop container, remove volume, remove network.
   */
  async destroy(sandboxId: string): Promise<void> {
    const shortId = sandboxId.slice(0, 8);
    const containerName = `gtd-sandbox-${shortId}`;

    try {
      const container = this.docker.getContainer(containerName);
      const info = await container.inspect();
      if (info.State.Running) await container.stop({ t: 5 });
      await container.remove({ v: true });
    } catch (err: unknown) {
      if ((err as { statusCode?: number }).statusCode !== 404) throw err;
    }

    // Cleanup network and volume (best effort)
    try { await this.docker.getNetwork(`gtd-net-${shortId}`).remove(); } catch { /* */ }
    try { await this.docker.getVolume(`gtd-vol-${shortId}`).remove(); } catch { /* */ }
  }

  /**
   * Get sandbox info by ID.
   */
  async get(sandboxId: string): Promise<SandboxInfo | null> {
    const shortId = sandboxId.slice(0, 8);
    const containerName = `gtd-sandbox-${shortId}`;

    try {
      const container = this.docker.getContainer(containerName);
      const info = await container.inspect();

      const networks = info.NetworkSettings.Networks as Record<
        string,
        { IPAddress: string } | undefined
      >;
      const net = Object.values(networks)[0];
      const ip = net?.IPAddress ?? '';

      return {
        id: sandboxId,
        containerId: info.Id,
        containerName,
        mcpEndpoint: ip ? `http://${ip}:${this.config.MCP_BRIDGE_PORT}` : '',
        status: info.State.Running ? 'running' : 'stopped',
      };
    } catch (err: unknown) {
      if ((err as { statusCode?: number }).statusCode === 404) return null;
      throw err;
    }
  }

  /**
   * List all GTD sandbox containers.
   */
  async list(): Promise<SandboxInfo[]> {
    const containers = await this.docker.listContainers({
      all: true,
      filters: { name: ['gtd-sandbox-'] },
    });

    return containers.map((c: DockerodeType.ContainerInfo) => {
      const name = c.Names[0]?.replace(/^\//, '') ?? '';
      const shortId = name.replace('gtd-sandbox-', '');
      const networkEntries = Object.values(c.NetworkSettings?.Networks ?? {}) as Array<
        { IPAddress: string } | undefined
      >;
      const ip = networkEntries[0]?.IPAddress ?? '';

      return {
        id: shortId, // We only have shortId from container name
        containerId: c.Id,
        containerName: name,
        mcpEndpoint: ip ? `http://${ip}:${this.config.MCP_BRIDGE_PORT}` : '',
        status: c.State === 'running' ? 'running' as const : 'stopped' as const,
      };
    });
  }

  /**
   * Execute a command inside a sandbox (for filesystem prep).
   */
  async exec(
    sandboxId: string,
    cmd: string[],
    timeoutMs = 30_000,
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const shortId = sandboxId.slice(0, 8);
    const container = this.docker.getContainer(`gtd-sandbox-${shortId}`);

    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: '/workspace',
    });

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Exec timeout')), timeoutMs);

      exec.start({ hijack: true, stdin: false }, (err: Error | null, stream: NodeJS.ReadableStream | undefined) => {
        if (err || !stream) {
          clearTimeout(timer);
          return reject(err ?? new Error('No stream'));
        }

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];

        this.docker.modem.demuxStream(
          stream,
          { write(chunk: Buffer) { stdoutChunks.push(chunk); } } as NodeJS.WritableStream,
          { write(chunk: Buffer) { stderrChunks.push(chunk); } } as NodeJS.WritableStream,
        );

        stream.on('end', async () => {
          clearTimeout(timer);
          const inspection = await exec.inspect();
          resolve({
            exitCode: inspection.ExitCode ?? -1,
            stdout: Buffer.concat(stdoutChunks).toString('utf8'),
            stderr: Buffer.concat(stderrChunks).toString('utf8'),
          });
        });
      });
    });
  }
}

function parseMemoryLimit(limit: string): number {
  const match = limit.match(/^(\d+(?:\.\d+)?)\s*(b|k|m|g|kb|mb|gb)$/i);
  if (!match) throw new Error(`Invalid memory limit: ${limit}`);
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    b: 1, k: 1024, kb: 1024, m: 1024 ** 2, mb: 1024 ** 2, g: 1024 ** 3, gb: 1024 ** 3,
  };
  return Math.floor(value * (multipliers[unit] ?? 1));
}
