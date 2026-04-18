import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

const links = [
  { to: '/skill-map', label: 'Skill Map' },
  { to: '/resume',    label: 'Resume'    },
  { to: '/job-fit',   label: 'Job Fit'   },
  { to: '/tracker',   label: 'Tracker'   },
];

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/" className={styles.logo}>
        <span className={styles.logoMark}>H</span>
        HireReady
      </NavLink>

      <div className={styles.links}>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [styles.link, isActive ? styles.active : ''].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
