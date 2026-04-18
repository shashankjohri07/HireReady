import { useState, useEffect, useRef } from 'react';
import styles from './JobModal.module.css';

const STATUSES = [
  { value: 'applied',   label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer',     label: 'Offer' },
  { value: 'rejected',  label: 'Rejected' },
];

export default function JobModal({ mode, initialStatus, job, onSave, onClose }) {
  const [form, setForm] = useState({
    company: job?.company ?? '',
    role: job?.role ?? '',
    status: job?.status ?? initialStatus ?? 'applied',
    date: job?.date ?? new Date().toISOString().slice(0, 10),
    salary: job?.salary ?? '',
    link: job?.link ?? '',
    notes: job?.notes ?? '',
  });

  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    onSave(form);
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === 'add' ? 'Add job' : 'Edit job'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Company *</label>
              <input
                ref={firstInputRef}
                className={styles.input}
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
                placeholder="e.g. Razorpay"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Role *</label>
              <input
                className={styles.input}
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                placeholder="e.g. Backend Engineer"
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.input}
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date applied</label>
              <input
                className={styles.input}
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Salary range</label>
              <input
                className={styles.input}
                value={form.salary}
                onChange={(e) => set('salary', e.target.value)}
                placeholder="e.g. 12–15 LPA"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Job link</label>
              <input
                className={styles.input}
                value={form.link}
                onChange={(e) => set('link', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Interview date, HR name, anything relevant..."
              rows={3}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={!form.company.trim() || !form.role.trim()}
            >
              {mode === 'add' ? 'Add job' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
