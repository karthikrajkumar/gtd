export interface SessionInfo {
  sessionId: string;
  sandboxId: string;
  mcpEndpoint: string;
  tools: Array<{ name: string; description: string }>;
  status: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: { content: Array<{ type: string; text: string }>; isError?: boolean };
  durationMs?: number;
  status: 'running' | 'done' | 'error';
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface OpenFile {
  path: string;
  content: string;
  language: string;
}
