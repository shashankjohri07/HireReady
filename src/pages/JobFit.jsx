import { useState } from 'react';
import { useChat } from '../hooks/useChat.js';
import ChatWindow from '../components/ChatWindow.jsx';
import styles from './JobFit.module.css';

export default function JobFit() {
  const [background, setBackground] = useState('');
  const [jd, setJd] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { messages, streaming, loading, error, sendMessage, reset } = useChat('jobfit');

  function handleSubmit() {
    if (!background.trim() || !jd.trim()) return;
    setSubmitted(true);
    sendMessage(
      `My background:\n${background}\n\n---\n\nJob description:\n${jd}`
    );
  }

  function handleReset() {
    reset();
    setBackground('');
    setJd('');
    setSubmitted(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Job Fit Checker</h1>
        <p className={styles.desc}>
          Paste any JD + your background. Realistic fit score + a specific prep plan to close the gap.
        </p>
      </div>

      {!submitted ? (
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Your background</label>
            <textarea
              className={styles.input}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Paste your resume or describe your experience — years of exp, skills, projects, current role..."
              rows={8}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Job description</label>
            <textarea
              className={styles.input}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={8}
            />
          </div>
          <div className={styles.footer}>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!background.trim() || !jd.trim()}
            >
              Check my fit →
            </button>
          </div>
        </div>
      ) : (
        <ChatWindow
          messages={messages}
          streaming={streaming}
          loading={loading}
          error={error}
          onSend={sendMessage}
          onReset={handleReset}
          placeholder="Ask about specific skill gaps or prep strategies..."
        />
      )}
    </div>
  );
}
