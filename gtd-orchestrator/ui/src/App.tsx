import { Header } from './components/layout/Header.js';
import { SplitLayout } from './components/layout/SplitLayout.js';
import { ChatPanel } from './components/chat/ChatPanel.js';
import { EditorPanel } from './components/editor/EditorPanel.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { useSessionStore } from './store/session-store.js';

export function App() {
  const { session } = useSessionStore();

  // Connect WebSocket when session exists
  useWebSocket(session?.sessionId ?? null);

  return (
    <div style={styles.app}>
      <Header />
      <SplitLayout
        left={<ChatPanel />}
        right={<EditorPanel />}
        defaultLeftWidth={38}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: '#1e1e1e',
  },
};
