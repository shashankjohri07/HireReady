import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

const modes = [
  {
    to: '/skill-map',
    icon: '⬡',
    title: 'Skill Map',
    desc: 'Set your target role and get a step-by-step roadmap — from core skills to negotiating the offer.',
    cta: 'Build my roadmap',
  },
  {
    to: '/resume',
    icon: '◻',
    title: 'Resume Analyzer',
    desc: 'Upload your resume for honest, role-specific feedback. No sugarcoating — just what to fix.',
    cta: 'Analyze my resume',
  },
  {
    to: '/job-fit',
    icon: '◈',
    title: 'Job Fit Checker',
    desc: 'Paste any job description and your background. Get a realistic fit score + prep plan.',
    cta: 'Check my fit',
  },
  {
    to: '/tracker',
    icon: '▦',
    title: 'Job Tracker',
    desc: 'Kanban board to track every application — Applied, Interview, Offer, Rejected.',
    cta: 'Track applications',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>AI Career Coach</p>
        <h1 className={styles.heading}>
          Land the job<br />
          you actually want.
        </h1>
        <p className={styles.sub}>
          Personalised career coaching for any role — tech, product, data, design, or beyond.
        </p>
      </div>

      <div className={styles.grid}>
        {modes.map(({ to, icon, title, desc, cta }) => (
          <button key={to} className={styles.card} onClick={() => navigate(to)}>
            <span className={styles.icon}>{icon}</span>
            <h2 className={styles.cardTitle}>{title}</h2>
            <p className={styles.cardDesc}>{desc}</p>
            <span className={styles.cardCta}>{cta} →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
