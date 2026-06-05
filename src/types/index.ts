export type HabitId = string;
export type DateString = string; // "yyyy-MM-dd"

export interface Habit {
  id: HabitId;
  name: string;
  color: string; // hex "#7CB9A8"
  createdAt: DateString;
  archivedAt?: DateString;
}

export interface HabitLog {
  habitId: HabitId;
  date: DateString;
  completedAt: string; // ISO timestamp
}

export type Theme = 'light' | 'dark' | 'system';

export type ActiveTab = 'today' | 'statistics' | 'settings';
