export type ChallengeId = string;
export type DateString = string; // "yyyy-MM-dd"

export interface Challenge {
  id: ChallengeId;
  name: string;
  color: string; // hex "#7CB9A8"
  createdAt: DateString;
  archivedAt?: DateString;
  order: number;
  reminderEnabled?: boolean;
  reminderTime?: string; // "HH:mm"
  activeDays?: number[]; // Пн=0 … Нд=6; undefined/порожній = всі дні
}

export interface ChallengeLog {
  challengeId: ChallengeId;
  date: DateString;
  completedAt: string; // ISO timestamp
}

export type Theme = 'light' | 'dark' | 'system';
export type Palette = 'default' | 'matcha' | 'crimson' | 'gallery' | 'frost' | 'dune';
export type StatScope = 'active' | 'archived';
export type ActiveTab = 'today' | 'statistics' | 'settings';
