import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import SkillMap from './pages/SkillMap.jsx';
import ResumeAnalyzer from './pages/ResumeAnalyzer.jsx';
import JobFit from './pages/JobFit.jsx';
import JobTracker from './pages/JobTracker.jsx';
import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/skill-map" element={<SkillMap />} />
          <Route path="/resume" element={<ResumeAnalyzer />} />
          <Route path="/job-fit" element={<JobFit />} />
          <Route path="/tracker" element={<JobTracker />} />
        </Routes>
      </main>
    </div>
  );
}
