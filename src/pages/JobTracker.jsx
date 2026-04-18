import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat.js';
import ChatWindow from '../components/ChatWindow.jsx';
import JobCard from '../components/JobCard.jsx';
import JobModal from '../components/JobModal.jsx';
import styles from './JobTracker.module.css';

const COLUMNS = [
  { id: 'applied',   label: 'Applied' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer',     label: 'Offer' },
  { id: 'rejected',  label: 'Rejected' },
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function JobTracker() {
  const [jobs, setJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hr_jobs') || '[]'); }
    catch { return []; }
  });
  const [modal,       setModal]       = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragId,      setDragId]      = useState(null);
  const [prepJob,     setPrepJob]     = useState(null);
  const [view,        setView]        = useState('board');

  const { messages, streaming, loading, error, sendMessage, reset } = useChat('jobtracker');

  useEffect(() => {
    localStorage.setItem('hr_jobs', JSON.stringify(jobs));
  }, [jobs]);

  function addJob(data) {
    setJobs(p => [...p, { id: uid(), ...data }]);
    setModal(null);
  }

  function updateJob(id, data) {
    setJobs(p => p.map(j => j.id === id ? { ...j, ...data } : j));
    setModal(null);
  }

  function deleteJob(id) {
    if (!confirm('Remove this job?')) return;
    setJobs(p => p.filter(j => j.id !== id));
  }

  function handleDragStart(e, jobId) {
    setDragId(jobId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('jobId', jobId);
  }

  function handleDrop(e, status) {
    e.preventDefault();
    const id = e.dataTransfer.getData('jobId');
    setJobs(p => p.map(j => j.id === id ? { ...j, status } : j));
    setDragOverCol(null);
    setDragId(null);
  }

  function handlePrepInterview(job) {
    setPrepJob(job);
    setView('prep');
    reset();
    setTimeout(() => {
      sendMessage(
        `I have an upcoming interview at **${job.company}** for the **${job.role}** position.\n\n` +
        `Help me prepare. I need:\n` +
        `1. The most likely interview questions for this role\n` +
        `2. What to research about ${job.company} before the interview\n` +
        `3. How to pitch myself for this specific role\n` +
        `4. Smart questions I should ask the interviewer\n` +
        `${job.notes ? `\nContext: ${job.notes}` : ''}`
      );
    }, 50);
  }

  const counts = Object.fromEntries(
    COLUMNS.map(c => [c.id, jobs.filter(j => j.status === c.id).length])
  );
  const interviewRate = counts.applied > 0
    ? Math.round((counts.interview / counts.applied) * 100)
    : 0;

  if (view === 'prep' && prepJob) {
    return (
      <div className={styles.page}>
        <div className={styles.prepHeader}>
          <button
            className={styles.backBtn}
            onClick={() => { setView('board'); setPrepJob(null); reset(); }}
          >
            ← Back to tracker
          </button>
          <div className={styles.prepMeta}>
            <span className={styles.prepCompany}>{prepJob.company}</span>
            <span className={styles.prepDot}>·</span>
            <span className={styles.prepRole}>{prepJob.role}</span>
          </div>
        </div>
        <ChatWindow
          messages={messages}
          streaming={streaming}
          loading={loading}
          error={error}
          onSend={sendMessage}
          onReset={() => { setView('board'); setPrepJob(null); reset(); }}
          placeholder={`Ask more about preparing for ${prepJob.company}...`}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.stats}>
          {COLUMNS.map(col => (
            <div key={col.id} className={styles.stat}>
              <span className={styles.statNum}>{counts[col.id]}</span>
              <span className={styles.statLabel}>{col.label}</span>
            </div>
          ))}
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{interviewRate}%</span>
            <span className={styles.statLabel}>Interview rate</span>
          </div>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setModal({ mode: 'add', status: 'applied' })}
        >
          + Add job
        </button>
      </div>

      <div className={styles.board}>
        {COLUMNS.map(col => {
          const colJobs = jobs.filter(j => j.status === col.id);
          const isOver  = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              className={`${styles.column} ${isOver ? styles.columnOver : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null); }}
              onDrop={e => handleDrop(e, col.id)}
            >
              <div className={styles.colHeader}>
                <span className={`${styles.colLabel} ${styles[`col_${col.id}`]}`}>
                  {col.label}
                </span>
                <span className={styles.colCount}>{colJobs.length}</span>
              </div>

              <div className={styles.cards}>
                {colJobs.length === 0 && (
                  <div className={`${styles.emptyCol} ${isOver ? styles.emptyColOver : ''}`}>
                    Drop here
                  </div>
                )}
                {colJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isDragging={dragId === job.id}
                    onDragStart={handleDragStart}
                    onEdit={() => setModal({ mode: 'edit', job })}
                    onDelete={() => deleteJob(job.id)}
                    onPrep={col.id === 'interview' ? () => handlePrepInterview(job) : null}
                  />
                ))}
              </div>

              <button
                className={styles.colAddBtn}
                onClick={() => setModal({ mode: 'add', status: col.id })}
              >
                + Add
              </button>
            </div>
          );
        })}
      </div>

      {jobs.length === 0 && (
        <div className={styles.emptyBoard}>
          <p className={styles.emptyTitle}>No jobs tracked yet</p>
          <p className={styles.emptySub}>
            Paste any job URL when adding — company and role fill in automatically.
          </p>
          <button
            className={styles.emptyAddBtn}
            onClick={() => setModal({ mode: 'add', status: 'applied' })}
          >
            + Add your first job
          </button>
        </div>
      )}

      {modal && (
        <JobModal
          mode={modal.mode}
          initialStatus={modal.status}
          job={modal.job}
          onSave={modal.mode === 'add' ? addJob : data => updateJob(modal.job.id, data)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
