import { useEffect, useRef, useCallback } from 'react';
import type { ServerMessage } from '../types/ws-protocol.js';
import { useChatStore } from '../store/chat-store.js';
import { useFileStore } from '../store/file-store.js';

export function useWebSocket(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { addAssistantText, addToolCallStart, updateToolCallResult, markDone, addSystemMessage } =
    useChatStore();
  const { openFile, setTree } = useFileStore();

  const connect = useCallback(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Subscribe to session
      ws.send(JSON.stringify({ type: 'subscribe', sessionId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        handleMessage(msg);
      } catch {
        // Ignore
      }
    };

    ws.onclose = () => {
      // Reconnect after 2s
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sessionId]);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'assistant_text':
          addAssistantText(msg.messageId, msg.text);
          break;

        case 'tool_call_start':
          addToolCallStart('', {
            id: msg.toolCallId,
            name: msg.name,
            arguments: msg.arguments,
            status: 'running',
          });
          break;

        case 'tool_call_result':
          updateToolCallResult(msg.toolCallId, msg.result, msg.durationMs);
          break;

        case 'assistant_done':
          markDone();
          break;

        case 'file_changed':
          // Refresh the Explorer sidebar whenever the tree is provided.
          if (msg.tree) {
            setTree(msg.tree);
          }
          for (const file of msg.files) {
            const ext = file.path.split('.').pop() ?? '';
            openFile({ path: file.path, content: file.content, language: extToLang(ext) });
          }
          break;

        case 'error':
          addSystemMessage(`Error: ${msg.message}`);
          markDone();
          break;

        case 'session_ready':
          addSystemMessage(`Session ready. Sandbox: ${msg.sandboxId}. ${msg.tools.length} tools available.`);
          break;
      }
    },
    [addAssistantText, addToolCallStart, updateToolCallResult, markDone, openFile, setTree, addSystemMessage],
  );

  const sendChat = useCallback(
    (content: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN && sessionId) {
        wsRef.current.send(JSON.stringify({ type: 'chat', sessionId, content }));
      }
    },
    [sessionId],
  );

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { sendChat };
}

function extToLang(ext: string): string {
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact',
    json: 'json', md: 'markdown', css: 'css', html: 'html', py: 'python',
    rs: 'rust', go: 'go', yaml: 'yaml', yml: 'yaml', sh: 'shell',
  };
  return map[ext.toLowerCase()] ?? 'plaintext';
}
