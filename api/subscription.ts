import type { VercelRequest, VercelResponse } from '@vercel/node';
import { putDevice, deleteDevice, type DeviceRecord } from './_lib/store';
import type { Reminder } from './_lib/schedule';

const TIME_RE = /^\d{2}:\d{2}$/;

const isReminder = (r: unknown): r is Reminder => {
  if (typeof r !== 'object' || r === null) return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.challengeId === 'string' &&
    typeof x.name === 'string' &&
    typeof x.time === 'string' && TIME_RE.test(x.time) &&
    Array.isArray(x.days) && x.days.every(d => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)
  );
};

interface PostBody {
  deviceId: string;
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  timezone: string;
  reminders: Reminder[];
}

const isPostBody = (b: unknown): b is PostBody => {
  if (typeof b !== 'object' || b === null) return false;
  const x = b as Record<string, unknown>;
  const sub = x.subscription as Record<string, unknown> | undefined;
  const keys = sub?.keys as Record<string, unknown> | undefined;
  return (
    typeof x.deviceId === 'string' && x.deviceId.length > 0 && x.deviceId.length <= 64 &&
    typeof sub?.endpoint === 'string' &&
    typeof keys?.p256dh === 'string' &&
    typeof keys?.auth === 'string' &&
    typeof x.timezone === 'string' && (x.timezone as string).length <= 64 &&
    Array.isArray(x.reminders) && x.reminders.every(isReminder)
  );
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const body: unknown = req.body;
    if (!isPostBody(body)) {
      return res.status(400).json({ error: 'invalid body' });
    }
    const record: DeviceRecord = {
      subscription: body.subscription,
      timezone: body.timezone,
      reminders: body.reminders,
      updatedAt: new Date().toISOString(),
    };
    await putDevice(body.deviceId, record);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const deviceId = (req.body as { deviceId?: unknown } | null)?.deviceId;
    if (typeof deviceId !== 'string' || !deviceId) {
      return res.status(400).json({ error: 'invalid body' });
    }
    await deleteDevice(deviceId);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({ error: 'method not allowed' });
}
