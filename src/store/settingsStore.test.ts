import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';

beforeEach(() => {
  useSettingsStore.setState({ theme: 'system' });
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
