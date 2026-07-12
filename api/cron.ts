import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { dueReminders } from './_lib/schedule.js';
import { getDeviceIds, getDevice, deleteDevice, tryMarkSent } from './_lib/store.js';

/**
 * Викликається зовнішнім кроном щохвилини (cron-job.org).
 * Ідемпотентний: маркери sent:* у Redis гарантують at-most-once
 * на кожне спрацювання нагадування, тому дублюючі тригери безпечні.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.authorization;
  const authorized =
    !!secret && (header === `Bearer ${secret}` || req.query.secret === secret);
  if (!authorized) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return res.status(500).json({ error: 'VAPID keys are not configured' });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:chubenko.dev@gmail.com',
    publicKey,
    privateKey,
  );

  const now = new Date();
  let due = 0;
  let sent = 0;
  let deduped = 0;
  let removed = 0;

  const deviceIds = await getDeviceIds();

  for (const deviceId of deviceIds) {
    const device = await getDevice(deviceId);
    if (!device) {
      // TTL запису сплив — прибираємо id із множини
      await deleteDevice(deviceId);
      removed++;
      continue;
    }

    const hits = dueReminders(device.reminders, device.timezone, now);
    due += hits.length;

    for (const hit of hits) {
      const fresh = await tryMarkSent(`sent:${deviceId}:${hit.challengeId}:${hit.localDate}:${hit.time}`);
      if (!fresh) {
        deduped++;
        continue;
      }
      try {
        await webpush.sendNotification(
          device.subscription,
          JSON.stringify({
            title: hit.name,
            body: 'Час виконати челендж! 🌿',
            challengeId: hit.challengeId,
          }),
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Підписка мертва — видаляємо девайс цілком
          await deleteDevice(deviceId);
          removed++;
          break;
        }
        console.error(`push send failed for ${deviceId}:`, status ?? err);
      }
    }
  }

  return res.status(200).json({ ok: true, devices: deviceIds.length, due, sent, deduped, removed });
}
