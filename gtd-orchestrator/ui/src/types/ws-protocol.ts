/**
 * WebSocket protocol types — mirrors server/src/ws/ws-protocol.ts
 */

export interface AssistantTextMessage {
  type: 'assistant_text';
  sessionId: string;
  messageId: string;
  text: string;
}

export interface ToolCallStartMessage {
  type: 'tool_call_start';
  sessionId: string;
  toolCallId: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallResultMessage {
  type: 'tool_call_result';
  sessionId: string;
  toolCallId: string;
  result: { content: Array<{ type: string; text: string }>; isError?: boolean };
  durationMs: number;
}

export interface AssistantDoneMessage {
  type: 'assistant_done';
  sessionId: string;
  messageId: string;
  stopReason: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

export interface FileChangedMessage {
  type: 'file_changed';
  sessionId: string;
  files: Array<{ path: string; content: string }>;
  tree?: FileTreeNode[];
}

export interface ErrorMessage {
  type: 'error';
  sessionId: string;
  message: string;
}

export interface SessionReadyMessage {
  type: 'session_ready';
  sessionId: string;
  sandboxId: string;
  tools: string[];
}

export type ServerMessage =
  | AssistantTextMessage
  | ToolCallStartMessage
  | ToolCallResultMessage
  | AssistantDoneMessage
  | FileChangedMessage
  | ErrorMessage
  | SessionReadyMessage;
