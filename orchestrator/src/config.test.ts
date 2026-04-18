import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Fresh env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return defaults when no env vars set', () => {
    // Vitest sets NODE_ENV=test, so delete it to check the real default
    delete process.env.NODE_ENV;
    const config = loadConfig();

    expect(config.PORT).toBe(3000);
    expect(config.HOST).toBe('0.0.0.0');
    expect(config.NODE_ENV).toBe('development');
    expect(config.DOCKER_SOCKET).toBe('/var/run/docker.sock');
    expect(config.WORKSPACE_IMAGE).toBe('gtd-workspace:latest');
    expect(config.SANDBOX_CPU_LIMIT).toBe(1);
    expect(config.SANDBOX_MEMORY_LIMIT).toBe('1g');
    expect(config.MCP_BRIDGE_PORT).toBe(3100);
    expect(config.MCP_BRIDGE_TIMEOUT_MS).toBe(65000);
  });

  it('should override defaults with env vars', () => {
    process.env.PORT = '4000';
    process.env.HOST = '127.0.0.1';
    process.env.NODE_ENV = 'production';
    process.env.WORKSPACE_IMAGE = 'custom-image:v2';
    process.env.SANDBOX_CPU_LIMIT = '2';
    process.env.SANDBOX_MEMORY_LIMIT = '2g';
    process.env.MCP_BRIDGE_PORT = '3200';

    const config = loadConfig();

    expect(config.PORT).toBe(4000);
    expect(config.HOST).toBe('127.0.0.1');
    expect(config.NODE_ENV).toBe('production');
    expect(config.WORKSPACE_IMAGE).toBe('custom-image:v2');
    expect(config.SANDBOX_CPU_LIMIT).toBe(2);
    expect(config.SANDBOX_MEMORY_LIMIT).toBe('2g');
    expect(config.MCP_BRIDGE_PORT).toBe(3200);
  });

  it('should accept test as NODE_ENV', () => {
    process.env.NODE_ENV = 'test';
    const config = loadConfig();
    expect(config.NODE_ENV).toBe('test');
  });
});
