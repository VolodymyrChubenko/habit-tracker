import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav/BottomNav';
import { SplashScreen } from '../components/SplashScreen/SplashScreen';
import { useSettingsStore } from '../store/settingsStore';
import { useReminderScheduler } from '../hooks/useReminderScheduler';
import styles from './App.module.scss';

export default function App() {
  const theme = useSettingsStore(s => s.theme);
  useReminderScheduler();

  const [showSplash, setShowSplash] = useState(
    () => typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('splashShown'),
  );

  const handleSplashDone = useCallback(() => {
    try { sessionStorage.setItem('splashShown', '1'); } catch { /* ignore */ }
    setShowSplash(false);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.matches
        ? root.setAttribute('data-theme', 'dark')
        : root.removeAttribute('data-theme');

      const handler = (e: MediaQueryListEvent) =>
        e.matches ? root.setAttribute('data-theme', 'dark') : root.removeAttribute('data-theme');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  return (
    <div className={styles.app}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
    </div>
  );
}
