import { useCallback } from 'react';
import { useSessionStore } from '../store/session-store.js';
import { useChatStore } from '../store/chat-store.js';
import { useFileStore } from '../store/file-store.js';

export function useSession() {
  const { session, isCreating, error, setSession, setCreating, setError, clearSession } =
    useSessionStore();
  const { clearMessages } = useChatStore();
  const { clearFiles } = useFileStore();

  const createSession = useCallback(
    async (opts?: { repoUrl?: string; repoBranch?: string }) => {
      setCreating(true);
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(opts ?? {}),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();
        setSession(data);
        return data;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [setSession, setCreating, setError],
  );

  const destroySession = useCallback(async () => {
    if (!session) return;
    try {
      await fetch(`/api/sessions/${session.sessionId}`, { method: 'DELETE' });
    } catch {
      // Best effort
    }
    clearSession();
    clearMessages();
    clearFiles();
  }, [session, clearSession, clearMessages, clearFiles]);

  return { session, isCreating, error, createSession, destroySession };
}
