import { useCallback } from 'react';
import { useChatStore } from '../store/chat-store.js';
import { useSessionStore } from '../store/session-store.js';

export function useChat() {
  const { messages, isProcessing, addUserMessage } = useChatStore();
  const { session } = useSessionStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session || isProcessing) return;

      addUserMessage(content);

      try {
        await fetch(`/api/sessions/${session.sessionId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
      } catch (err: unknown) {
        console.error('Failed to send message:', err);
      }
    },
    [session, isProcessing, addUserMessage],
  );

  return { messages, isProcessing, sendMessage };
}
