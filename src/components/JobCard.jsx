import styles from './JobCard.module.css';

export default function JobCard({ job, onDragStart, onEdit, onDelete, onPrep }) {
  const dateStr = job.date
    ? new Date(job.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  return (
    <div
      className={styles.card}
      draggable
      onDragStart={(e) => onDragStart(e, job.id)}
    >
      <div className={styles.top}>
        <div className={styles.info}>
          <p className={styles.company}>{job.company}</p>
          <p className={styles.role}>{job.role}</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.action} onClick={onEdit} title="Edit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className={`${styles.action} ${styles.actionDelete}`} onClick={onDelete} title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.meta}>
        {dateStr && <span className={styles.badge}>{dateStr}</span>}
        {job.salary && <span className={styles.badge}>{job.salary}</span>}
        {job.notes && (
          <span className={styles.notePreview} title={job.notes}>
            {job.notes.length > 40 ? job.notes.slice(0, 40) + '…' : job.notes}
          </span>
        )}
      </div>

      {onPrep && (
        <button className={styles.prepBtn} onClick={onPrep}>
          Prep for interview →
        </button>
      )}
    </div>
  );
}
