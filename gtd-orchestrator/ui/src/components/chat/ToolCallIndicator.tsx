import { useState } from 'react';
import type { ToolCall } from '../../types/session.js';

interface Props {
  toolCall: ToolCall;
}

export function ToolCallIndicator({ toolCall }: Props) {
  const [expanded, setExpanded] = useState(false);

  const statusColor =
    toolCall.status === 'running' ? '#dcdcaa' :
    toolCall.status === 'error' ? '#f44747' : '#4ec9b0';

  const statusIcon =
    toolCall.status === 'running' ? '⏳' :
    toolCall.status === 'error' ? '❌' : '✅';

  return (
    <div style={styles.container}>
      <div
        style={styles.header}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={styles.icon}>{statusIcon}</span>
        <span style={{ ...styles.name, color: statusColor }}>{toolCall.name}</span>
        {toolCall.durationMs !== undefined && (
          <span style={styles.duration}>{toolCall.durationMs}ms</span>
        )}
        <span style={styles.chevron}>{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div style={styles.details}>
          <div style={styles.section}>
            <div style={styles.sectionLabel}>Arguments:</div>
            <pre style={styles.code}>
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>

          {toolCall.result && (
            <div style={styles.section}>
              <div style={styles.sectionLabel}>Result:</div>
              <pre style={{
                ...styles.code,
                ...(toolCall.result.isError ? styles.errorCode : {}),
              }}>
                {toolCall.result.content.map((c) => c.text).join('\n')}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    margin: '8px 0',
    background: '#252526',
    borderRadius: 6,
    border: '1px solid #3c3c3c',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  icon: {
    fontSize: 12,
  },
  name: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'monospace',
    flex: 1,
  },
  duration: {
    fontSize: 11,
    color: '#666',
  },
  chevron: {
    fontSize: 10,
    color: '#666',
  },
  details: {
    padding: '0 10px 10px',
    borderTop: '1px solid #3c3c3c',
  },
  section: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  code: {
    fontSize: 11,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    background: '#1e1e1e',
    padding: 8,
    borderRadius: 4,
    color: '#d4d4d4',
    overflow: 'auto',
    maxHeight: 200,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    margin: 0,
  },
  errorCode: {
    color: '#f44747',
    borderLeft: '3px solid #f44747',
  },
};
