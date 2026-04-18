import { useState } from 'react';
import type { FileNode } from '../../types/session.js';

interface Props {
  nodes: FileNode[];
  onFileClick: (path: string) => void;
  activeFile: string | null;
}

export function FileTree({ nodes, onFileClick, activeFile }: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>Explorer</div>
      <div style={styles.tree}>
        {nodes.length === 0 && (
          <div style={styles.empty}>No files yet</div>
        )}
        {nodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            onFileClick={onFileClick}
            activeFile={activeFile}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  onFileClick: (path: string) => void;
  activeFile: string | null;
}

function TreeNode({ node, depth, onFileClick, activeFile }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isActive = node.path === activeFile;

  if (node.type === 'directory') {
    return (
      <div>
        <div
          style={{ ...styles.item, paddingLeft: 12 + depth * 16 }}
          onClick={() => setExpanded(!expanded)}
        >
          <span style={styles.dirIcon}>{expanded ? '📂' : '📁'}</span>
          <span style={styles.dirName}>{node.name}</span>
        </div>
        {expanded && node.children?.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            onFileClick={onFileClick}
            activeFile={activeFile}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.item,
        paddingLeft: 12 + depth * 16,
        ...(isActive ? styles.activeItem : {}),
      }}
      onClick={() => onFileClick(node.path)}
    >
      <span style={styles.fileIcon}>{getFileIcon(node.name)}</span>
      <span style={styles.fileName}>{node.name}</span>
    </div>
  );
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const icons: Record<string, string> = {
    ts: '🟦', tsx: '⚛️', js: '🟨', jsx: '⚛️',
    json: '📋', md: '📝', css: '🎨', html: '🌐',
    py: '🐍', rs: '🦀', go: '🐹', yaml: '⚙️',
    yml: '⚙️', sh: '🖥️', sql: '🗃️',
  };
  return icons[ext] ?? '📄';
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 220,
    borderRight: '1px solid #404040',
    background: '#252526',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
  },
  header: {
    padding: '8px 12px',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#888',
    borderBottom: '1px solid #404040',
  },
  tree: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '4px 0',
  },
  empty: {
    padding: 20,
    textAlign: 'center',
    color: '#555',
    fontSize: 12,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 8px',
    cursor: 'pointer',
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  activeItem: {
    background: '#37373d',
  },
  dirIcon: {
    fontSize: 12,
    flexShrink: 0,
  },
  dirName: {
    color: '#ccc',
    fontWeight: 500,
  },
  fileIcon: {
    fontSize: 12,
    flexShrink: 0,
  },
  fileName: {
    color: '#aaa',
  },
};
