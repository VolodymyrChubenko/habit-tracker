import { useState } from 'react';
import { BottomSheet } from '../../components/BottomSheet/BottomSheet';
import { ColorPicker } from '../../components/ColorPicker/ColorPicker';
import { ReminderField } from '../../components/ReminderField/ReminderField';
import { useChallengesStore } from '../../store/challengesStore';
import type { Challenge } from '../../types';
import styles from './EditChallengeSheet.module.scss';

interface Props {
  challenge: Challenge;
  onClose: () => void;
}

export const EditChallengeSheet = ({ challenge, onClose }: Props) => {
  const [name, setName] = useState(challenge.name);
  const [color, setColor] = useState(challenge.color);
  const [reminderEnabled, setReminderEnabled] = useState(challenge.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(challenge.reminderTime ?? '09:00');
  const [activeDays, setActiveDays] = useState<number[]>(
    challenge.activeDays && challenge.activeDays.length > 0 ? challenge.activeDays : [0, 1, 2, 3, 4, 5, 6],
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { updateChallenge, archiveChallenge, deleteChallenge } = useChallengesStore();

  const handleSave = () => {
    if (!name.trim()) return;
    updateChallenge(challenge.id, {
      name: name.trim(),
      color,
      reminderEnabled,
      reminderTime,
      activeDays,
    });
    onClose();
  };

  const handleStop = () => {
    archiveChallenge(challenge.id);
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteChallenge(challenge.id);
    onClose();
  };

  return (
    <BottomSheet onClose={onClose}>
      <p className={styles.title}>Редагувати челендж</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="challenge-title-edit">Назва</label>
        <input
          id="challenge-title-edit"
          name="challenge-title-edit"
          className={styles.input}
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          autoFocus
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Колір</span>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <ReminderField
        enabled={reminderEnabled}
        time={reminderTime}
        activeDays={activeDays}
        onToggle={() => setReminderEnabled(v => !v)}
        onTimeChange={setReminderTime}
        onActiveDaysChange={setActiveDays}
      />

      <button
        type="button"
        className={styles.btnSave}
        disabled={!name.trim()}
        onClick={handleSave}
      >
        Зберегти зміни
      </button>

      <div className={styles.danger}>
        <p className={styles.dangerLabel}>Небезпечна зона</p>

        {!challenge.archivedAt && (
          <button type="button" className={styles.btnStop} onClick={handleStop}>
            Зупинити челендж
          </button>
        )}

        <button
          type="button"
          className={confirmDelete ? styles.btnDeleteConfirm : styles.btnDelete}
          onClick={handleDelete}
        >
          {confirmDelete ? 'Натисніть ще раз для підтвердження' : 'Видалити челендж'}
        </button>
      </div>
    </BottomSheet>
  );
};
