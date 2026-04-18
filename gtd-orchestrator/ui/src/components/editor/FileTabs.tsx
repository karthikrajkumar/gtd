import type { OpenFile } from '../../types/session.js';

interface Props {
  files: OpenFile[];
  activeFile: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export function FileTabs({ files, activeFile, onSelect, onClose }: Props) {
  if (files.length === 0) return null;

  return (
    <div style={styles.container}>
      {files.map((file) => {
        const isActive = file.path === activeFile;
        const fileName = file.path.split('/').pop() ?? file.path;

        return (
          <div
            key={file.path}
            style={{
              ...styles.tab,
              ...(isActive ? styles.activeTab : {}),
            }}
            onClick={() => onSelect(file.path)}
          >
            <span style={styles.tabName}>{fileName}</span>
            <span
              style={styles.closeBtn}
              onClick={(e) => {
                e.stopPropagation();
                onClose(file.path);
              }}
            >
              ×
            </span>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    background: '#2d2d2d',
    borderBottom: '1px solid #404040',
    overflowX: 'auto',
    flexShrink: 0,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    fontSize: 12,
    color: '#888',
    cursor: 'pointer',
    borderRight: '1px solid #404040',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  activeTab: {
    background: '#1e1e1e',
    color: '#ccc',
    borderBottom: '2px solid #569cd6',
  },
  tabName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  closeBtn: {
    fontSize: 14,
    color: '#666',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 2px',
  },
};
