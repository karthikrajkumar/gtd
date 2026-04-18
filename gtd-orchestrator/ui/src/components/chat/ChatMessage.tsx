import type { ChatMessage as ChatMessageType } from '../../types/session.js';
import { ToolCallIndicator } from './ToolCallIndicator.js';

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div style={{ ...styles.wrapper, ...(isUser ? styles.userWrapper : {}) }}>
      <div style={styles.avatar}>
        {isUser ? '👤' : isSystem ? '⚙️' : '🤖'}
      </div>
      <div style={styles.content}>
        <div style={styles.role}>
          {isUser ? 'You' : isSystem ? 'System' : 'GTD Assistant'}
        </div>
        <div
          style={{
            ...styles.text,
            ...(isSystem ? styles.systemText : {}),
          }}
        >
          {message.content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
        {message.toolCalls?.map((tc) => (
          <ToolCallIndicator key={tc.id} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    gap: 10,
    padding: '12px 16px',
    borderBottom: '1px solid #2a2a2a',
  },
  userWrapper: {
    background: '#2a2d33',
  },
  avatar: {
    fontSize: 16,
    flexShrink: 0,
    width: 24,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  role: {
    fontSize: 12,
    fontWeight: 600,
    color: '#569cd6',
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#d4d4d4',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  systemText: {
    color: '#888',
    fontStyle: 'italic',
  },
};
