import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat.js';
import ChatWindow from '../components/ChatWindow.jsx';
import styles from './SkillMap.module.css';

const ROADMAP = [
  {
    num: '01',
    label: 'Foundations',
    nodes: [
      { id: 'core_skills',   title: 'Core Skills',      sub: 'Role-specific fundamentals' },
      { id: 'tools',         title: 'Tools & Workflow',  sub: 'Industry-standard tooling'  },
      { id: 'communication', title: 'Communication',     sub: 'Writing · async · presenting' },
    ],
  },
  {
    num: '02',
    label: 'Build Depth',
    nodes: [
      { id: 'domain',          title: 'Domain Knowledge', sub: 'Industry + role concepts' },
      { id: 'projects',        title: 'Projects',          sub: 'Portfolio that proves skills' },
      { id: 'problemsolving',  title: 'Problem Solving',   sub: 'Cases · coding · analysis' },
    ],
  },
  {
    num: '03',
    label: 'Interview Prep',
    nodes: [
      { id: 'resume',      title: 'Resume & LinkedIn', sub: 'ATS-ready · impact-driven' },
      { id: 'behavioural', title: 'Behavioural',       sub: 'STAR · common questions'   },
      { id: 'technical',   title: 'Technical Round',   sub: 'Role-specific depth'        },
    ],
  },
  {
    num: '04',
    label: 'Land the Offer',
    nodes: [
      { id: 'applications', title: 'Applications', sub: 'Where + how to apply'       },
      { id: 'networking',   title: 'Networking',    sub: 'Referrals · cold outreach'  },
      { id: 'negotiation',  title: 'Negotiation',   sub: 'Salary · offer evaluation'  },
    ],
  },
];

async function fetchHNStories() {
  const res = await fetch('/api/news');
  if (!res.ok) throw new Error('Failed to fetch news');
  const { stories } = await res.json();
  return stories;
}

function timeAgo(unix) {
  const diff = Math.floor((Date.now() / 1000 - unix) / 60);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function SkillMap() {
  const [targetRole, setTargetRole] = useState('');
  const [roleSet,    setRoleSet]    = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [view,       setView]       = useState('feed');
  const [stories,    setStories]    = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const { messages, streaming, loading, error, sendMessage, reset } = useChat('skillmap');

  useEffect(() => {
    fetchHNStories()
      .then(setStories)
      .finally(() => setStoriesLoading(false));
  }, []);

  function handleRoleSubmit(e) {
    e.preventDefault();
    if (!targetRole.trim()) return;
    setRoleSet(true);
  }

  function startChat(prompt, label) {
    setActiveNode(label);
    setView('chat');
    reset();
    setTimeout(() => sendMessage(prompt), 50);
  }

  function handleNodeClick(node) {
    const roleContext = roleSet ? ` for a ${targetRole} role` : '';
    startChat(
      `Explain **${node.title}**${roleContext}.\n\n1. Why it matters for my target job\n2. Key concepts\n3. How to build this skill step by step\n4. One thing to do today`,
      node.title
    );
  }

  function handleStoryClick(story) {
    startChat(
      `I just read this headline: "${story.title}"\n\nExplain what this is about, why it matters for someone in tech, and how it's relevant to my career${roleSet ? ` as a ${targetRole}` : ''}.`,
      story.title
    );
  }

  function handleBack() {
    setView('feed');
    setActiveNode(null);
    reset();
  }

  // Hide the raw auto-generated prompts — show only the AI responses
  const displayMessages = messages.filter(
    m => !(m.role === 'user' && (
      m.content.startsWith('Explain **') ||
      m.content.startsWith('I just read this headline')
    ))
  );

  if (view === 'chat') {
    return (
      <div className={styles.page}>
        <div className={styles.chatView}>
          <div className={styles.chatHeader}>
            <button className={styles.backBtn} onClick={handleBack}>← Back</button>
            {activeNode && <span className={styles.chatTopic}>{activeNode}</span>}
          </div>
          <ChatWindow
            messages={displayMessages}
            streaming={streaming}
            loading={loading}
            error={error}
            onSend={sendMessage}
            onReset={handleBack}
            placeholder="Ask a follow-up question..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Role bar */}
      <div className={styles.roleBar}>
        <form className={styles.roleForm} onSubmit={handleRoleSubmit}>
          <span className={styles.roleLabel}>Target role</span>
          <input
            className={styles.roleInput}
            value={targetRole}
            onChange={e => { setTargetRole(e.target.value); setRoleSet(false); }}
            placeholder="e.g. Backend Developer, Data Analyst, Product Manager..."
          />
          {!roleSet ? (
            <button className={styles.roleBtn} type="submit" disabled={!targetRole.trim()}>Set</button>
          ) : (
            <span className={styles.roleBadge}>{targetRole}</span>
          )}
        </form>
      </div>

      <div className={styles.feed}>
        {/* Roadmap */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Career Roadmap</p>
          <div className={styles.roadmapCards}>
            {ROADMAP.map(phase => (
              <div key={phase.num} className={styles.phaseCard}>
                <div className={styles.phaseCardHead}>
                  <span className={styles.phaseNum}>{phase.num}</span>
                  <span className={styles.phaseTitle}>{phase.label}</span>
                </div>
                <div className={styles.skillList}>
                  {phase.nodes.map(node => (
                    <button
                      key={node.id}
                      className={styles.skillRow}
                      onClick={() => handleNodeClick(node)}
                    >
                      <div className={styles.skillInfo}>
                        <span className={styles.skillName}>{node.title}</span>
                        <span className={styles.skillSub}>{node.sub}</span>
                      </div>
                      <svg className={styles.skillArrow} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7M7 7h10v10"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HN Stories */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Today in Tech · Hacker News</p>
          {storiesLoading ? (
            <div className={styles.storiesSkeleton}>
              {[...Array(4)].map((_, i) => <div key={i} className={styles.skeletonCard} />)}
            </div>
          ) : (
            <div className={styles.stories}>
              {stories.map(story => (
                <button key={story.id} className={styles.storyCard} onClick={() => handleStoryClick(story)}>
                  <p className={styles.storyTitle}>{story.title}</p>
                  <div className={styles.storyMeta}>
                    <span>{story.score} points</span>
                    <span>{story.descendants ?? 0} comments</span>
                    <span>{timeAgo(story.time)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
