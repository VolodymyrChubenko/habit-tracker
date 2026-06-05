import { useEffect } from 'react';
import styles from './BottomSheet.module.scss';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet = ({ onClose, children }: Props) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        {children}
      </div>
    </div>
  );
};
