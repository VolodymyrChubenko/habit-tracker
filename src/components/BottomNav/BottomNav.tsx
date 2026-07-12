import { NavLink } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import styles from './BottomNav.module.scss';

const IconToday = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="3" rx="1.5" />
    <rect x="3" y="11" width="18" height="3" rx="1.5" />
    <rect x="3" y="17" width="18" height="3" rx="1.5" />
  </svg>
);

const IconStats = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="14" width="4" height="7" rx="1" />
    <rect x="10" y="9" width="4" height="12" rx="1" />
    <rect x="17" y="4" width="4" height="17" rx="1" />
  </svg>
);

const IconAchievements = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const tabs = [
  { to: '/', label: 'Сьогодні', Icon: IconToday, end: true },
  { to: '/statistics', label: 'Статистика', Icon: IconStats, end: false },
  { to: '/achievements', label: 'Досягнення', Icon: IconAchievements, end: false },
  { to: '/settings', label: 'Налаштування', Icon: IconSettings, end: false },
];

const renderTab = ({ to, label, Icon, end }: (typeof tabs)[number]) => (
  <NavLink
    key={to}
    to={to}
    end={end}
    className={({ isActive }) => [styles.tab, isActive ? styles.active : ''].join(' ')}
  >
    <Icon />
    <span>{label}</span>
  </NavLink>
);

export const BottomNav = () => {
  const openAddSheet = useUIStore(s => s.openAddSheet);

  return (
    <nav className={styles.nav}>
      {tabs.slice(0, 2).map(renderTab)}
      <div className={styles.spacer} aria-hidden="true" />
      {tabs.slice(2).map(renderTab)}
      <button className={styles.centerAdd} onClick={openAddSheet} aria-label="Додати челендж">
        +
      </button>
    </nav>
  );
};
