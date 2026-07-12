import { nanoid } from 'nanoid';
import type { Challenge } from '../types';

const DEVICE_ID_KEY = 'challenge-tracker-device-id';
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Контракт із api/subscription (див. api/_lib/schedule.ts). */
export interface ReminderPayload {
  challengeId: string;
  name: string;
  time: string; // "HH:mm"
  days: number[]; // Пн=0 … Нд=6
}

export interface SubscriptionPayload {
  deviceId: string;
  subscription: PushSubscriptionJSON;
  timezone: string;
  reminders: ReminderPayload[];
}

export const isPushSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const getOrCreateDeviceId = (): string => {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = nanoid();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

/** Розклад нагадувань для сервера: активні челенджі з увімкненим нагадуванням. */
export const buildReminders = (challenges: Challenge[]): ReminderPayload[] =>
  challenges
    .filter(c => !c.archivedAt && c.reminderEnabled)
    .map(c => ({
      challengeId: c.id,
      name: c.name,
      time: c.reminderTime ?? '09:00',
      days: c.activeDays && c.activeDays.length > 0 ? c.activeDays : ALL_DAYS,
    }));

export const urlBase64ToUint8Array = (base64: string): Uint8Array<ArrayBuffer> => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

/** Поточна push-підписка, або null (без SW — напр., у dev — теж null). */
export const getPushSubscription = async (): Promise<PushSubscription | null> => {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
};

/** Підписатися на push (вимагає granted-дозволу і активного SW). */
export const subscribePush = async (): Promise<PushSubscription> => {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!key) throw new Error('VITE_VAPID_PUBLIC_KEY не заданий');
  // getRegistration замість .ready: без SW (dev-режим) .ready висить вічно
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw new Error('Service worker не зареєстрований');
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
};

/** POST розкладу на сервер; мовчазний no-op при недоступному API (dev). */
export const postSubscription = async (payload: SubscriptionPayload): Promise<void> => {
  try {
    await fetch('/api/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('push sync недоступний:', err);
  }
};

/** Видалити девайс на сервері (вимкнення master-тогла). */
export const deleteSubscription = async (deviceId: string): Promise<void> => {
  try {
    await fetch('/api/subscription', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
  } catch (err) {
    console.warn('push sync недоступний:', err);
  }
};
