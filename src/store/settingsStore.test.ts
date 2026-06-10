import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';

beforeEach(() => {
  useSettingsStore.setState({
    theme: 'system',
    reminderEnabled: false,
    reminderTime: '08:00',
  });
});

describe('setTheme', () => {
  it('updates theme to light', () => {
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('updates theme to dark', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });
});

describe('reminder settings', () => {
  it('defaults to disabled with time 08:00', () => {
    const { reminderEnabled, reminderTime } = useSettingsStore.getState();
    expect(reminderEnabled).toBe(false);
    expect(reminderTime).toBe('08:00');
  });

  it('setReminderEnabled toggles the value', () => {
    useSettingsStore.getState().setReminderEnabled(true);
    expect(useSettingsStore.getState().reminderEnabled).toBe(true);
  });

  it('setReminderTime updates the time string', () => {
    useSettingsStore.getState().setReminderTime('09:30');
    expect(useSettingsStore.getState().reminderTime).toBe('09:30');
  });
});
