import { useState, useRef } from 'react';
import { useChat } from '../hooks/useChat.js';
import ChatWindow from '../components/ChatWindow.jsx';
import styles from './ResumeAnalyzer.module.css';

async function extractText(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/resume/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: base64, type: file.type }),
  });

  if (!res.ok) throw new Error('Failed to parse file');
  const { text } = await res.json();
  return text;
}

export default function ResumeAnalyzer() {
  const [stage, setStage] = useState('upload'); // 'upload' | 'parsing' | 'chat'
  const [parseError, setParseError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { messages, streaming, loading, error, sendMessage, reset } = useChat('resume');

  async function handleFile(file) {
    if (!file) return;
    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(file.type)) {
      setParseError('Only PDF and .txt files are supported.');
      return;
    }
    setParseError(null);
    setStage('parsing');
    try {
      const text = await extractText(file);
      setStage('chat');
      setTimeout(() => {
        sendMessage(`Please review my resume:\n\n${text}`);
      }, 50);
    } catch (e) {
      setParseError(e.message);
      setStage('upload');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleReset() {
    reset();
    setStage('upload');
    setParseError(null);
  }

  if (stage === 'chat') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Resume Analyzer</h1>
            <p className={styles.desc}>Ask follow-up questions — your resume is in context for the whole session.</p>
          </div>
          <button className={styles.restartBtn} onClick={handleReset}>Upload new resume</button>
        </div>
        <ChatWindow
          messages={messages}
          streaming={streaming}
          loading={loading}
          error={error}
          onSend={sendMessage}
          onReset={handleReset}
          placeholder="Ask about a specific section, bullet point, or skill gap..."
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Resume Analyzer</h1>
        <p className={styles.desc}>Honest feedback from a senior engineering manager. Upload your resume to start.</p>
      </div>

      <div className={styles.uploadArea}>
        <div
          className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''} ${stage === 'parsing' ? styles.dropzoneParsing : ''}`}
          onClick={() => stage !== 'parsing' && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {stage === 'parsing' ? (
            <div className={styles.parsing}>
              <div className={styles.spinner} />
              <p>Parsing your resume...</p>
            </div>
          ) : (
            <>
              <div className={styles.uploadIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className={styles.uploadTitle}>Drop your resume here</p>
              <p className={styles.uploadSub}>PDF or TXT · click to browse</p>
            </>
          )}
        </div>

        {parseError && <p className={styles.parseError}>{parseError}</p>}

        <div className={styles.tips}>
          <p className={styles.tipsLabel}>WHAT WE CHECK</p>
          <div className={styles.tipsList}>
            {['ATS keyword gaps', 'Weak bullet points', 'Missing metrics', 'Project impact clarity', 'Skills section relevance'].map(t => (
              <span key={t} className={styles.tip}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
