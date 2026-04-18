import { create } from 'zustand';
import type { ChatMessage, ToolCall } from '../types/session.js';

interface ChatStore {
  messages: ChatMessage[];
  isProcessing: boolean;

  addUserMessage: (content: string) => void;
  addAssistantText: (messageId: string, text: string) => void;
  addToolCallStart: (messageId: string, toolCall: ToolCall) => void;
  updateToolCallResult: (toolCallId: string, result: ToolCall['result'], durationMs: number) => void;
  markDone: () => void;
  addSystemMessage: (content: string) => void;
  setProcessing: (processing: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isProcessing: false,

  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          timestamp: new Date(),
        },
      ],
      isProcessing: true,
    })),

  addAssistantText: (messageId, text) =>
    set((state) => {
      const existing = state.messages.find((m) => m.id === messageId);
      if (existing) {
        // Append to existing assistant message
        return {
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, content: m.content + text } : m,
          ),
        };
      }
      // New assistant message
      return {
        messages: [
          ...state.messages,
          {
            id: messageId,
            role: 'assistant' as const,
            content: text,
            timestamp: new Date(),
            toolCalls: [],
          },
        ],
      };
    }),

  addToolCallStart: (_messageId, toolCall) =>
    set((state) => {
      // Find the last assistant message and add the tool call
      const messages = [...state.messages];
      const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistant) {
        lastAssistant.toolCalls = [...(lastAssistant.toolCalls ?? []), toolCall];
      }
      return { messages };
    }),

  updateToolCallResult: (toolCallId, result, durationMs) =>
    set((state) => ({
      messages: state.messages.map((m) => ({
        ...m,
        toolCalls: m.toolCalls?.map((tc) =>
          tc.id === toolCallId
            ? { ...tc, result, durationMs, status: result?.isError ? 'error' as const : 'done' as const }
            : tc,
        ),
      })),
    })),

  markDone: () => set({ isProcessing: false }),

  addSystemMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content,
          timestamp: new Date(),
        },
      ],
    })),

  setProcessing: (isProcessing) => set({ isProcessing }),

  clearMessages: () => set({ messages: [], isProcessing: false }),
}));
