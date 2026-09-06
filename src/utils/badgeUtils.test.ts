import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearReminders, syncBadge } from './badgeUtils';
import type { ReminderNotification } from './badgeUtils';

const notif = (tag: string, data?: { challengeId?: string }): ReminderNotification => ({
  tag,
  data,
  close: vi.fn<() => void>(),
});

const regWith = (notifications: ReminderNotification[]) => ({
  getNotifications: vi.fn().mockResolvedValue(notifications),
});

const stubBadgeApi = () => {
  const setAppBadge = vi.fn().mockResolvedValue(undefined);
  const clearAppBadge = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { setAppBadge, clearAppBadge });
  return { setAppBadge, clearAppBadge };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('syncBadge', () => {
  it('ставить бейдж із кількістю активних сповіщень', async () => {
    const { setAppBadge, clearAppBadge } = stubBadgeApi();
    await syncBadge(regWith([notif('reminder-a'), notif('reminder-b')]));
    expect(setAppBadge).toHaveBeenCalledWith(2);
    expect(clearAppBadge).not.toHaveBeenCalled();
  });

  it('нуль сповіщень → clearAppBadge', async () => {
    const { setAppBadge, clearAppBadge } = stubBadgeApi();
    await syncBadge(regWith([]));
    expect(clearAppBadge).toHaveBeenCalled();
    expect(setAppBadge).not.toHaveBeenCalled();
  });

  it('excludeTag не враховується в лічильнику', async () => {
    const { setAppBadge, clearAppBadge } = stubBadgeApi();
    await syncBadge(regWith([notif('reminder-a'), notif('reminder-b')]), 'reminder-a');
    expect(setAppBadge).toHaveBeenCalledWith(1);
    expect(clearAppBadge).not.toHaveBeenCalled();
  });

  it('без Badging API — no-op без помилок', async () => {
    vi.stubGlobal('navigator', {});
    const reg = regWith([notif('reminder-a')]);
    await expect(syncBadge(reg)).resolves.toBeUndefined();
    expect(reg.getNotifications).not.toHaveBeenCalled();
  });

  it('reject від setAppBadge не прокидається назовні', async () => {
    const setAppBadge = vi.fn().mockRejectedValue(new Error('nope'));
    vi.stubGlobal('navigator', { setAppBadge, clearAppBadge: vi.fn() });
    await expect(syncBadge(regWith([notif('reminder-a')]))).resolves.toBeUndefined();
  });
});

describe('clearReminders', () => {
  it('закриває reminder-сповіщення і чистить бейдж', async () => {
    const { clearAppBadge } = stubBadgeApi();
    const a = notif('reminder-a');
    const plain = notif('reminder');
    await clearReminders(regWith([a, plain]));
    expect(a.close).toHaveBeenCalled();
    expect(plain.close).toHaveBeenCalled();
    expect(clearAppBadge).toHaveBeenCalled();
  });

  it('чистить бейдж навіть якщо getNotifications впав', async () => {
    const { clearAppBadge } = stubBadgeApi();
    const reg = { getNotifications: vi.fn().mockRejectedValue(new Error('nope')) };
    await expect(clearReminders(reg)).resolves.toEqual([]);
    expect(clearAppBadge).toHaveBeenCalled();
  });

  it('без Badging API лише закриває сповіщення', async () => {
    vi.stubGlobal('navigator', {});
    const a = notif('reminder-a');
    await expect(clearReminders(regWith([a]))).resolves.toEqual(['a']);
    expect(a.close).toHaveBeenCalled();
  });

  it('повертає challengeId із data', async () => {
    stubBadgeApi();
    const ids = await clearReminders(
      regWith([notif('reminder-abc', { challengeId: 'abc' })]),
    );
    expect(ids).toEqual(['abc']);
  });

  it('розбирає тег, коли data порожня (сповіщення зі старого SW)', async () => {
    stubBadgeApi();
    expect(await clearReminders(regWith([notif('reminder-legacy-id')]))).toEqual(['legacy-id']);
  });

  it('тег без id не дає challengeId', async () => {
    stubBadgeApi();
    expect(await clearReminders(regWith([notif('reminder')]))).toEqual([]);
  });

  it('дедуплікує id і ігнорує не-reminder сповіщення', async () => {
    stubBadgeApi();
    const other = notif('achievement-x');
    const ids = await clearReminders(
      regWith([notif('reminder-a'), notif('reminder-a', { challengeId: 'a' }), other]),
    );
    expect(ids).toEqual(['a']);
    expect(other.close).not.toHaveBeenCalled();
  });
});
