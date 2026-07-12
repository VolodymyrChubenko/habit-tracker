import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import type { Challenge, ChallengeId, ChallengeLog, DateString } from '../types';
import { adoptLegacyStorageKey } from '../utils/storageMigration';

const STORAGE_KEY = 'challenge-tracker-storage';

/** Shape written by builds that called these "habits". */
interface LegacyLog {
  date: DateString;
  completedAt: string;
  challengeId?: ChallengeId;
  habitId?: ChallengeId;
}

interface LegacyChallengesState {
  habits?: Challenge[];
  challenges?: Challenge[];
  logs?: LegacyLog[];
}

interface ChallengesState {
  challenges: Challenge[];
  logs: ChallengeLog[];
  addChallenge: (name: string, color: string, reminder?: { enabled: boolean; time: string; activeDays?: number[] }) => void;
  updateChallenge: (challengeId: ChallengeId, patch: Partial<Pick<Challenge, 'name' | 'color' | 'reminderEnabled' | 'reminderTime' | 'activeDays'>>) => void;
  deleteChallenge: (challengeId: ChallengeId) => void;
  completeChallenge: (challengeId: ChallengeId, date: DateString) => void;
  uncompleteChallenge: (challengeId: ChallengeId, date: DateString) => void;
  archiveChallenge: (challengeId: ChallengeId) => void;
  unarchiveChallenge: (challengeId: ChallengeId) => void;
  saveLogsForDate: (date: DateString, completedChallengeIds: ChallengeId[], scopeChallengeIds: ChallengeId[]) => void;
  reorderChallenges: (orderedIds: ChallengeId[]) => void;
}

const nextOrder = (challenges: Challenge[]): number =>
  challenges.reduce((max, h) => Math.max(max, h.order ?? 0), -1) + 1;

const ALL_DAYS: number[] = [0, 1, 2, 3, 4, 5, 6];

adoptLegacyStorageKey('habit-tracker-storage', STORAGE_KEY);

export const useChallengesStore = create<ChallengesState>()(
  persist(
    (set, get) => ({
      challenges: [],
      logs: [],

      addChallenge: (name, color, reminder) =>
        set(state => ({
          challenges: [
            ...state.challenges,
            {
              id: nanoid(),
              name,
              color,
              createdAt: format(new Date(), 'yyyy-MM-dd'),
              order: nextOrder(state.challenges),
              reminderEnabled: reminder?.enabled ?? false,
              reminderTime: reminder?.time ?? '09:00',
              activeDays: reminder?.activeDays ?? ALL_DAYS,
            },
          ],
        })),

      updateChallenge: (challengeId, patch) =>
        set(state => ({
          challenges: state.challenges.map(h =>
            h.id === challengeId ? { ...h, ...patch } : h,
          ),
        })),

      deleteChallenge: (challengeId) =>
        set(state => ({
          challenges: state.challenges.filter(h => h.id !== challengeId),
          logs: state.logs.filter(l => l.challengeId !== challengeId),
        })),

      completeChallenge: (challengeId, date) => {
        const already = get().logs.some(l => l.challengeId === challengeId && l.date === date);
        if (already) return;
        set(state => ({
          logs: [...state.logs, { challengeId, date, completedAt: new Date().toISOString() }],
        }));
      },

      uncompleteChallenge: (challengeId, date) =>
        set(state => ({
          logs: state.logs.filter(l => !(l.challengeId === challengeId && l.date === date)),
        })),

      archiveChallenge: (challengeId) =>
        set(state => ({
          challenges: state.challenges.map(h =>
            h.id === challengeId ? { ...h, archivedAt: format(new Date(), 'yyyy-MM-dd') } : h,
          ),
        })),

      unarchiveChallenge: (challengeId) =>
        set(state => ({
          challenges: state.challenges.map(h =>
            h.id === challengeId ? { ...h, archivedAt: undefined } : h,
          ),
        })),

      saveLogsForDate: (date, completedChallengeIds, scopeChallengeIds) =>
        set(state => {
          const scope = new Set(scopeChallengeIds);
          return {
            logs: [
              ...state.logs.filter(l => l.date !== date || !scope.has(l.challengeId)),
              ...completedChallengeIds.map(challengeId => ({
                challengeId,
                date,
                completedAt: new Date().toISOString(),
              })),
            ],
          };
        }),

      reorderChallenges: (orderedIds) =>
        set(state => {
          const position = new Map(orderedIds.map((id, i) => [id, i]));
          return {
            challenges: state.challenges.map(h =>
              position.has(h.id) ? { ...h, order: position.get(h.id)! } : h,
            ),
          };
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as LegacyChallengesState | null;
        if (!state) return state as unknown as ChallengesState;

        // v2 renamed `habits` -> `challenges` and `log.habitId` -> `log.challengeId`.
        if (version < 2) {
          state.challenges = state.challenges ?? state.habits ?? [];
          state.logs = (state.logs ?? []).map(({ habitId, ...log }) => ({
            ...log,
            challengeId: log.challengeId ?? habitId,
          }));
          delete state.habits;
        }

        if (version === 0) {
          state.challenges = (state.challenges ?? []).map((h, i) => ({ ...h, order: h.order ?? i }));
        }

        // v3 added per-challenge activeDays (Пн=0 … Нд=6).
        if (version < 3) {
          state.challenges = (state.challenges ?? []).map(h => ({
            ...h,
            activeDays: h.activeDays ?? ALL_DAYS,
          }));
        }

        return state as unknown as ChallengesState;
      },
    },
  ),
);
