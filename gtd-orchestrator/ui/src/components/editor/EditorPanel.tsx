import { useFiles } from '../../hooks/useFiles.js';
import { FileTree } from './FileTree.js';
import { FileTabs } from './FileTabs.js';
import { MonacoEditor } from './MonacoEditor.js';

export function EditorPanel() {
  const { tree, openFiles, activeFile, fetchFile, closeFile, setActiveFile } = useFiles();

  const activeOpenFile = openFiles.find((f) => f.path === activeFile);

  return (
    <div style={styles.container}>
      <div style={styles.body}>
        {/* File Tree Sidebar */}
        <FileTree
          nodes={tree}
          onFileClick={fetchFile}
          activeFile={activeFile}
        />

        {/* Editor Area */}
        <div style={styles.editorArea}>
          <FileTabs
            files={openFiles}
            activeFile={activeFile}
            onSelect={setActiveFile}
            onClose={closeFile}
          />

          <div style={styles.editorContent}>
            {activeOpenFile ? (
              <MonacoEditor
                content={activeOpenFile.content}
                language={activeOpenFile.language}
                path={activeOpenFile.path}
              />
            ) : (
              <div style={styles.emptyEditor}>
                <div style={styles.emptyIcon}>📝</div>
                <div style={styles.emptyText}>
                  {tree.length > 0
                    ? 'Select a file from the explorer to view its contents'
                    : 'Files will appear here as code is generated'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
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
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  editorContent: {
    flex: 1,
    overflow: 'hidden',
  },
  emptyEditor: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#555',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 13,
    maxWidth: 300,
    textAlign: 'center',
    lineHeight: 1.5,
  },
};
