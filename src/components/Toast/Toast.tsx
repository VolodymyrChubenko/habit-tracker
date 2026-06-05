import styles from './Toast.module.scss';

interface Props {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const Toast = ({ message, actionLabel, onAction }: Props) => (
  <div className={styles.toast}>
    <span>{message}</span>
    {actionLabel && (
      <button className={styles.action} onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);
