import { useRemindersStore } from '../../store/remindersStore';
import { useTodayProgress } from '../../hooks/useTodayProgress';
import type { ChallengeId } from '../../types';
import styles from './ReminderBanner.module.scss';

const scrollToChallenge = (id: ChallengeId) =>
  document
    .getElementById(`challenge-${id}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

/**
 * Показує, за якими челенджами прийшли push-нагадування, поки застосунок був
 * закритий. Перетин із todoChallenges: виконане або заархівоване відсіюється,
 * тому банер зникає сам, щойно все відмічено.
 */
export const ReminderBanner = () => {
  const pendingIds = useRemindersStore(s => s.pendingIds);
  const dismiss = useRemindersStore(s => s.dismiss);
  const { todoChallenges } = useTodayProgress();

  const pending = todoChallenges.filter(c => pendingIds.includes(c.id));
  if (pending.length === 0) return null;

  return (
    <div className={styles.banner}>
      <span className={styles.icon} aria-hidden="true">🔔</span>
      <div className={styles.body}>
        <div className={styles.title}>Час виконати</div>
        <div className={styles.names}>
          {pending.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ' · '}
              <button className={styles.name} onClick={() => scrollToChallenge(c.id)}>
                {c.name}
              </button>
            </span>
          ))}
        </div>
      </div>
      <button className={styles.close} onClick={dismiss} aria-label="Сховати нагадування">
        ×
      </button>
    </div>
  );
};
