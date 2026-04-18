import { useState, useRef } from 'react';

interface Props {
  onSend: (content: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = '40px';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  };

  return (
    <div style={styles.container}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={placeholder ?? 'Ask GTD to build something...'}
        disabled={disabled}
        style={styles.textarea}
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        style={{
          ...styles.sendButton,
          ...(disabled || !value.trim() ? styles.sendButtonDisabled : {}),
        }}
      >
        {disabled ? '...' : '↑'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    padding: '8px 12px',
    borderTop: '1px solid #404040',
    background: '#252526',
  },
  textarea: {
    flex: 1,
    background: '#3c3c3c',
    border: '1px solid #555',
    borderRadius: 8,
    color: '#d4d4d4',
    padding: '10px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    minHeight: 40,
    maxHeight: 160,
    lineHeight: 1.4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#0e639c',
    color: '#fff',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    background: '#3c3c3c',
    color: '#666',
    cursor: 'default',
  },
};
