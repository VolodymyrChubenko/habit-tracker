/**
 * Тонкий шар над Upstash Redis — єдине місце, яке знає про сховище.
 * Схема ключів:
 *   devices                                    — SET усіх deviceId
 *   device:{deviceId}                          — JSON DeviceRecord, TTL 60 днів (оновлюється при sync)
 *   sent:{deviceId}:{challengeId}:{date}:{HH:mm} — маркер надісланого нагадування, TTL 6 год
 */
import { Redis } from '@upstash/redis';
import type { Reminder } from './schedule';

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface DeviceRecord {
  subscription: PushSubscriptionRecord;
  timezone: string;
  reminders: Reminder[];
  updatedAt: string;
}

const DEVICES_KEY = 'devices';
const DEVICE_TTL_SECONDS = 60 * 24 * 60 * 60; // авто-очистка покинутих девайсів
const SENT_TTL_SECONDS = 6 * 60 * 60;

let redis: Redis | null = null;

const getRedis = (): Redis => {
  if (!redis) {
    // Vercel Marketplace інжектить або UPSTASH_*, або KV_* — підтримуємо обидва.
    const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('Redis env vars (UPSTASH_REDIS_REST_* / KV_REST_API_*) не задані');
    redis = new Redis({ url, token });
  }
  return redis;
};

export const getDeviceIds = async (): Promise<string[]> =>
  getRedis().smembers(DEVICES_KEY);

export const getDevice = async (deviceId: string): Promise<DeviceRecord | null> =>
  getRedis().get<DeviceRecord>(`device:${deviceId}`);

export const putDevice = async (deviceId: string, record: DeviceRecord): Promise<void> => {
  const r = getRedis();
  await r.set(`device:${deviceId}`, record, { ex: DEVICE_TTL_SECONDS });
  await r.sadd(DEVICES_KEY, deviceId);
};

export const deleteDevice = async (deviceId: string): Promise<void> => {
  const r = getRedis();
  await r.del(`device:${deviceId}`);
  await r.srem(DEVICES_KEY, deviceId);
};

/** SET NX: true — нагадування ще не надсилалось, маркер поставлено. */
export const tryMarkSent = async (key: string): Promise<boolean> => {
  const res = await getRedis().set(key, 1, { nx: true, ex: SENT_TTL_SECONDS });
  return res === 'OK';
};
