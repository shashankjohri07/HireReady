import { useState, useEffect, useRef } from 'react';
import styles from './JobModal.module.css';

const STATUSES = [
  { value: 'applied',   label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer',     label: 'Offer' },
  { value: 'rejected',  label: 'Rejected' },
];

function parseTitle(raw) {
  const t = raw.replace(/\s+/g, ' ').trim();
  let m;

  // "Role at Company" — most common (LinkedIn, Greenhouse, Wellfound, Lever)
  m = t.match(/^(.+?)\s+at\s+([^|·\-\n]+?)(?:\s*[|·\-].*)?$/i);
  if (m) return { role: m[1].trim(), company: m[2].trim() };

  // "Company - Role" (Lever, some ATS)
  m = t.match(/^([^|·\-]{2,40}?)\s*[-–]\s*(.+?)(?:\s*[|·].*)?$/i);
  if (m) {
    const [a, b] = [m[1].trim(), m[2].trim()];
    // Shorter left side is usually the company name
    if (a.split(' ').length <= 3) return { company: a, role: b };
    return { role: a, company: b };
  }

  // "Role | Company"
  m = t.match(/^(.+?)\s*[|·]\s*([^|·]+?)(?:\s*[|·].*)?$/i);
  if (m) return { role: m[1].trim(), company: m[2].trim() };

  return { role: '', company: '' };
}

function isUrl(val) {
  return /^https?:\/\/.+\..+/.test(val.trim());
}

async function fetchJobDetails(url) {
  const res = await fetch(`/api/fetch-job?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('fetch failed');
  return res.json();
}

export default function JobModal({ mode, initialStatus, job, onSave, onClose }) {
  const [form, setForm] = useState({
    company: job?.company ?? '',
    role:    job?.role    ?? '',
    status:  job?.status  ?? initialStatus ?? 'applied',
    date:    job?.date    ?? new Date().toISOString().slice(0, 10),
    salary:  job?.salary  ?? '',
    link:    job?.link    ?? '',
    notes:   job?.notes   ?? '',
  });
  const [fetching, setFetching] = useState(false);

  const firstInputRef = useRef(null);
  const fetchTimer    = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleLinkChange(value) {
    set('link', value);

    clearTimeout(fetchTimer.current);
    if (!isUrl(value)) return;

    // Only auto-fill if company/role are still empty
    fetchTimer.current = setTimeout(async () => {
      setFetching(true);
      try {
        const { title, ogTitle } = await fetchJobDetails(value);
        const { role, company } = parseTitle(ogTitle || title);
        setForm(f => ({
          ...f,
          company: f.company || company,
          role:    f.role    || role,
        }));
      } catch {
        // silently ignore — user can fill manually
      } finally {
        setFetching(false);
      }
    }, 600);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    onSave(form);
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
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
          {/* Job link first — paste URL to auto-fill */}
          <div className={styles.field}>
            <label className={styles.label}>
              Job link
              {fetching && <span className={styles.fetchingDot} />}
              {!fetching && !form.company && (
                <span className={styles.labelHint}>paste URL to auto-fill</span>
              )}
            </label>
            <input
              ref={firstInputRef}
              className={styles.input}
              value={form.link}
              onChange={e => handleLinkChange(e.target.value)}
              placeholder="https://linkedin.com/jobs/… or naukri.com/…"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Company *</label>
              <input
                className={styles.input}
                value={form.company}
                onChange={e => set('company', e.target.value)}
                placeholder="e.g. Razorpay"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Role *</label>
              <input
                className={styles.input}
                value={form.role}
                onChange={e => set('role', e.target.value)}
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
                onChange={e => set('status', e.target.value)}
              >
                {STATUSES.map(s => (
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
                onChange={e => set('date', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Salary range</label>
              <input
                className={styles.input}
                value={form.salary}
                onChange={e => set('salary', e.target.value)}
                placeholder="e.g. 12–15 LPA"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
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
