/**
 * Session state types for the orchestrator.
 */

import type { Content, FunctionDeclaration } from '@google/genai';

export type SessionStatus = 'creating' | 'ready' | 'busy' | 'destroyed';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface SessionState {
  id: string;
  sandboxId: string;
  mcpEndpoint: string;

  /** Gemini-format function declarations (converted from MCP) */
  geminiTools: FunctionDeclaration[];

  /** Original MCP tool definitions */
  mcpToolDefs: McpToolDefinition[];

  /** Full conversation history (Gemini Content[] format) */
  messages: Content[];

  /** Known file paths in the workspace */
  fileTree: string[];

  createdAt: Date;
  status: SessionStatus;
}
