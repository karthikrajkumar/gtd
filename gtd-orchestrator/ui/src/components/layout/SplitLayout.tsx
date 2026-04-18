import { useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
  left: ReactNode;
  right: ReactNode;
  defaultLeftWidth?: number; // percentage
}

export function SplitLayout({ left, right, defaultLeftWidth = 35 }: Props) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(Math.max(pct, 20), 80));
    };

    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div ref={containerRef} style={styles.container}>
      <div style={{ ...styles.pane, width: `${leftWidth}%` }}>{left}</div>
      <div style={styles.divider} onMouseDown={handleMouseDown} />
      <div style={{ ...styles.pane, width: `${100 - leftWidth}%` }}>{right}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  pane: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  divider: {
    width: 4,
    cursor: 'col-resize',
    background: '#404040',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
};
