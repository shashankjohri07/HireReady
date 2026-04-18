import styles from './Roadmap.module.css';

/**
 * Generic career roadmap — applies to any job role.
 * Phases cover the universal journey from fundamentals to offer.
 */
const PHASES = [
  {
    phase: '01',
    label: 'Foundations',
    nodes: [
      { id: 'core_skills',    title: 'Core Skills',       sub: 'Role-specific fundamentals' },
      { id: 'tools',          title: 'Tools & Workflow',   sub: 'Industry-standard tooling' },
      { id: 'communication',  title: 'Communication',      sub: 'Writing · presenting · async' },
    ],
  },
  {
    phase: '02',
    label: 'Build Depth',
    nodes: [
      { id: 'domain',     title: 'Domain Knowledge',  sub: 'Industry + role-specific concepts' },
      { id: 'projects',   title: 'Projects',           sub: 'Portfolio work that proves skills' },
      { id: 'problemsolving', title: 'Problem Solving', sub: 'Case studies · coding · analysis' },
    ],
  },
  {
    phase: '03',
    label: 'Interview Prep',
    nodes: [
      { id: 'resume',       title: 'Resume & LinkedIn',  sub: 'ATS-ready · impact-driven' },
      { id: 'behavioural',  title: 'Behavioural',        sub: 'STAR method · common questions' },
      { id: 'technical',    title: 'Technical Round',    sub: 'Role-specific depth questions' },
    ],
  },
  {
    phase: '04',
    label: 'Land the Offer',
    nodes: [
      { id: 'applications', title: 'Applications',   sub: 'Where + how to apply effectively' },
      { id: 'networking',   title: 'Networking',      sub: 'Referrals · LinkedIn · cold reach' },
      { id: 'negotiation',  title: 'Negotiation',     sub: 'Salary · offer evaluation' },
    ],
  },
];

export default function Roadmap({ onNodeClick, activeNodeId }) {
  return (
    <div className={styles.roadmap}>
      {PHASES.map((phase, pi) => (
        <div key={phase.phase} className={styles.phaseWrap}>
          <div className={styles.phase}>
            <div className={styles.phaseHeader}>
              <span className={styles.phaseNum}>{phase.phase}</span>
              <span className={styles.phaseLabel}>{phase.label}</span>
            </div>
            <div className={styles.nodes}>
              {phase.nodes.map((node) => (
                <button
                  key={node.id}
                  className={`${styles.node} ${activeNodeId === node.id ? styles.nodeActive : ''}`}
                  onClick={() => onNodeClick(node)}
                >
                  <span className={styles.nodeTitle}>{node.title}</span>
                  <span className={styles.nodeSub}>{node.sub}</span>
                </button>
              ))}
            </div>
          </div>
          {pi < PHASES.length - 1 && (
            <div className={styles.connector}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
