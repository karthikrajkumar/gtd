import { useCallback } from 'react';
import { useFileStore } from '../store/file-store.js';
import { useSessionStore } from '../store/session-store.js';

export function useFiles() {
  const { tree, openFiles, activeFile, setTree, openFile, closeFile, setActiveFile } =
    useFileStore();
  const { session } = useSessionStore();

  const fetchFileTree = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/sessions/${session.sessionId}/files`);
      if (res.ok) {
        const data = await res.json();
        setTree(data.tree);
      }
    } catch {
      // Ignore
    }
  }, [session, setTree]);

  const fetchFile = useCallback(
    async (path: string) => {
      if (!session) return;
      try {
        const res = await fetch(`/api/sessions/${session.sessionId}/files/${path}`);
        if (res.ok) {
          const data = await res.json();
          openFile({ path: data.path, content: data.content, language: data.language });
        }
      } catch {
        // Ignore
      }
    },
    [session, openFile],
  );

  return { tree, openFiles, activeFile, fetchFileTree, fetchFile, closeFile, setActiveFile };
}
