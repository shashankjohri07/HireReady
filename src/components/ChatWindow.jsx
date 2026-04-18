import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble.jsx';
import styles from './ChatWindow.module.css';

export default function ChatWindow({
  messages,
  streaming,
  loading,
  error,
  onSend,
  onReset,
  placeholder = 'Ask anything...',
  hint,
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setInput('');
  }

  return (
    <div className={styles.window}>
      <div className={styles.messages}>
        {messages.length === 0 && !streaming && (
          <div className={styles.empty}>
            {hint && <p className={styles.hint}>{hint}</p>}
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {streaming && (
          <MessageBubble role="assistant" content={streaming} isStreaming />
        )}

        {error && (
          <div className={styles.error}>
            {error} — check your API key in <code>.env</code>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        {messages.length > 0 && (
          <button className={styles.reset} onClick={onReset} title="New conversation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        )}
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={loading}
        />
        <button
          className={styles.send}
          onClick={submit}
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
