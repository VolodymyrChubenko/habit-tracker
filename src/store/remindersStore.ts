import { create } from 'zustand';
import type { ChallengeId } from '../types';

// Ефемерний стан — челенджі, за якими прийшло push-нагадування і застосунок
// щойно відкрили. Навмисно без persist: нагадування живуть рівно один сеанс,
// перезапуск застосунку = «я це вже бачив».
interface RemindersState {
  pendingIds: ChallengeId[];
  addPending: (ids: ChallengeId[]) => void;
  dismiss: () => void;
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  pendingIds: [],
  addPending: ids => {
    const current = get().pendingIds;
    const fresh = [...new Set(ids)].filter(id => id && !current.includes(id));
    if (fresh.length === 0) return;
    set({ pendingIds: [...current, ...fresh] });
  },
  dismiss: () => set({ pendingIds: [] }),
}));
