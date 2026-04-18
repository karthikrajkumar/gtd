import { useSession } from '../../hooks/useSession.js';
import { useFiles } from '../../hooks/useFiles.js';
import { useState } from 'react';

export function Header() {
  const { session, isCreating, error, createSession, destroySession } = useSession();
  const { fetchFileTree } = useFiles();
  const [repoUrl, setRepoUrl] = useState('');

  const handleCreate = async () => {
    const opts = repoUrl ? { repoUrl } : undefined;
    await createSession(opts);
    // Fetch file tree after session is created
    setTimeout(() => fetchFileTree(), 1000);
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <span style={styles.logo}>GTD</span>
        <span style={styles.title}>Orchestrator</span>
      </div>

      <div style={styles.center}>
        {!session && (
          <>
            <input
              type="text"
              placeholder="Repository URL (optional)"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              style={styles.input}
            />
            <button
              onClick={handleCreate}
              disabled={isCreating}
              style={styles.button}
            >
              {isCreating ? 'Creating...' : 'New Sandbox'}
            </button>
          </>
        )}
        {session && (
          <div style={styles.sessionInfo}>
            <span style={styles.statusDot} />
            <span style={styles.sessionText}>
              Session: {session.sessionId.slice(0, 8)} | {session.tools.length} tools
            </span>
            <button onClick={fetchFileTree} style={styles.iconButton} title="Refresh files">
              ↻
            </button>
            <button onClick={destroySession} style={styles.destroyButton}>
              Destroy
            </button>
          </div>
        )}
      </div>

      <div style={styles.right}>
        {error && <span style={styles.error}>{error}</span>}
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    padding: '0 12px',
    background: '#2d2d2d',
    borderBottom: '1px solid #404040',
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontWeight: 700,
    fontSize: 14,
    color: '#569cd6',
    letterSpacing: 1,
  },
  title: {
    fontSize: 13,
    color: '#888',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    background: '#3c3c3c',
    border: '1px solid #555',
    borderRadius: 4,
    color: '#ccc',
    padding: '4px 8px',
    fontSize: 12,
    width: 280,
    outline: 'none',
  },
  button: {
    background: '#0e639c',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  destroyButton: {
    background: '#c53030',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    cursor: 'pointer',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    fontSize: 16,
    cursor: 'pointer',
    padding: '2px 6px',
  },
  sessionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#4ec9b0',
  },
  sessionText: {
    fontSize: 12,
    color: '#aaa',
  },
  right: {},
  error: {
    fontSize: 12,
    color: '#f44747',
  },
};
