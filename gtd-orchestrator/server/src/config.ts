import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  /** Google AI (Gemini) API key — get one at https://aistudio.google.com/apikey */
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  /** Gemini model to use */
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  /** Max tokens per Gemini response */
  GEMINI_MAX_TOKENS: z.coerce.number().default(8192),

  /** Base URL of the sandbox service (orchestrator/) */
  SANDBOX_SERVICE_URL: z.string().url().default('http://localhost:3000'),

  /**
   * Timeout for MCP tool calls (ms).
   * Must exceed:
   *   - GTD's 60s execSync
   *   - Bridge's 600s run_bash cap (for npx create-expo-app, npm install)
   */
  MCP_TOOL_TIMEOUT_MS: z.coerce.number().default(605_000),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  return envSchema.parse(process.env);
}
