import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from './settingsStore';

beforeEach(() => {
  useSettingsStore.setState({
    theme: 'system',
    palette: 'default',
    pushEnabled: false,
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

describe('setPalette', () => {
  it('за замовчуванням default', () => {
    expect(useSettingsStore.getState().palette).toBe('default');
  });

  it('змінює палітру незалежно від теми', () => {
    useSettingsStore.getState().setTheme('dark');
    useSettingsStore.getState().setPalette('matcha');
    const state = useSettingsStore.getState();
    expect(state.palette).toBe('matcha');
    expect(state.theme).toBe('dark');
  });
});

describe('setPushEnabled', () => {
  it('вимкнено за замовчуванням', () => {
    expect(useSettingsStore.getState().pushEnabled).toBe(false);
  });

  it('вмикає і вимикає push', () => {
    useSettingsStore.getState().setPushEnabled(true);
    expect(useSettingsStore.getState().pushEnabled).toBe(true);
    useSettingsStore.getState().setPushEnabled(false);
    expect(useSettingsStore.getState().pushEnabled).toBe(false);
  });
});

describe('міграція v1 → v2 (pushEnabled)', () => {
  it('додає pushEnabled=false до старих налаштувань', async () => {
    localStorage.setItem('challenge-tracker-settings', JSON.stringify({
      state: { theme: 'dark' },
      version: 1,
    }));

    vi.resetModules();
    const mod = await import('./settingsStore');
    const state = mod.useSettingsStore.getState();

    expect(state.theme).toBe('dark');
    expect(state.pushEnabled).toBe(false);

    localStorage.removeItem('challenge-tracker-settings');
  });
});

describe('міграція v2 → v3 (palette)', () => {
  it("додає palette='default' і зберігає інші поля", async () => {
    localStorage.setItem('challenge-tracker-settings', JSON.stringify({
      state: { theme: 'light', pushEnabled: true },
      version: 2,
    }));

    vi.resetModules();
    const mod = await import('./settingsStore');
    const state = mod.useSettingsStore.getState();

    expect(state.theme).toBe('light');
    expect(state.pushEnabled).toBe(true);
    expect(state.palette).toBe('default');

    localStorage.removeItem('challenge-tracker-settings');
  });

  it('міграція з v1 теж додає palette', async () => {
    localStorage.setItem('challenge-tracker-settings', JSON.stringify({
      state: { theme: 'dark' },
      version: 1,
    }));

    vi.resetModules();
    const mod = await import('./settingsStore');
    expect(mod.useSettingsStore.getState().palette).toBe('default');

    localStorage.removeItem('challenge-tracker-settings');
  });
});
