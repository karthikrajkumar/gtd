import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Docker
  DOCKER_SOCKET: z.string().default('/var/run/docker.sock'),
  WORKSPACE_IMAGE: z.string().default('gtd-workspace:latest'),
  SANDBOX_CPU_LIMIT: z.coerce.number().default(1),
  SANDBOX_MEMORY_LIMIT: z.string().default('1g'),

  // MCP Bridge (port inside sandbox containers)
  MCP_BRIDGE_PORT: z.coerce.number().default(3100),
  MCP_BRIDGE_TIMEOUT_MS: z.coerce.number().default(65000),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  return envSchema.parse(process.env);
}
