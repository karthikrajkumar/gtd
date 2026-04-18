import { useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat.js';
import { ChatMessage } from './ChatMessage.js';
import { ChatInput } from './ChatInput.js';
import { useSessionStore } from '../../store/session-store.js';

export function ChatPanel() {
  const { messages, isProcessing, sendMessage } = useChat();
  const { session } = useSessionStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={styles.container}>
      {/* Panel header */}
      <div style={styles.header}>
        <span style={styles.headerText}>Chat</span>
        {isProcessing && <span style={styles.processing}>Processing...</span>}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            {session
              ? 'Start a conversation. Ask GTD to build something!'
              : 'Create a sandbox to get started.'}
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={!session || isProcessing}
        placeholder={
          !session
            ? 'Create a sandbox first...'
            : isProcessing
              ? 'Waiting for response...'
              : 'Ask GTD to build something... (Enter to send, Shift+Enter for newline)'
        }
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1e1e1e',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    borderBottom: '1px solid #404040',
    background: '#252526',
    flexShrink: 0,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 600,
    color: '#ccc',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  processing: {
    fontSize: 11,
    color: '#dcdcaa',
    animation: 'pulse 1.5s infinite',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
  },
};
