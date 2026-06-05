import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav/BottomNav';
import styles from './App.module.scss';

export default function App() {
  return (
    <div className={styles.app}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
