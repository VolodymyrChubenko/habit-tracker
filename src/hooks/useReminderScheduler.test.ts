import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReminderScheduler } from './useReminderScheduler';
import { useSettingsStore } from '../store/settingsStore';

const mockPostMessage = vi.fn();
const mockActive = { postMessage: mockPostMessage };

beforeEach(() => {
  mockPostMessage.mockClear();
  useSettingsStore.setState({
    theme: 'system',
    reminderEnabled: false,
    reminderTime: '08:00',
    setTheme: vi.fn(),
    setReminderEnabled: vi.fn(),
    setReminderTime: vi.fn(),
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      ready: Promise.resolve({ active: mockActive }),
    },
    configurable: true,
    writable: true,
  });
});

describe('useReminderScheduler', () => {
  it('sends SCHEDULE_REMINDER on mount with store defaults', async () => {
    renderHook(() => useReminderScheduler());
    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'SCHEDULE_REMINDER',
        enabled: false,
        time: '08:00',
      });
    });
  });

  it('re-sends when reminderEnabled changes', async () => {
    mockPostMessage.mockClear();
    const { rerender } = renderHook(() => useReminderScheduler());
    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'SCHEDULE_REMINDER',
        enabled: false,
        time: '08:00',
      });
    });

    mockPostMessage.mockClear();
    act(() => {
      useSettingsStore.setState({
        theme: 'system',
        reminderEnabled: true,
        reminderTime: '08:00',
        setTheme: vi.fn(),
        setReminderEnabled: vi.fn(),
        setReminderTime: vi.fn(),
      });
    });
    rerender();

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'SCHEDULE_REMINDER',
        enabled: true,
        time: '08:00',
      });
    });
  });

  it('re-sends when reminderTime changes', async () => {
    mockPostMessage.mockClear();
    const { rerender } = renderHook(() => useReminderScheduler());
    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'SCHEDULE_REMINDER',
        enabled: false,
        time: '08:00',
      });
    });

    mockPostMessage.mockClear();
    act(() => {
      useSettingsStore.setState({
        theme: 'system',
        reminderEnabled: false,
        reminderTime: '21:00',
        setTheme: vi.fn(),
        setReminderEnabled: vi.fn(),
        setReminderTime: vi.fn(),
      });
    });
    rerender();

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'SCHEDULE_REMINDER',
        enabled: false,
        time: '21:00',
      });
    });
  });

  it('does nothing when serviceWorker is not supported', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    mockPostMessage.mockClear();
    renderHook(() => useReminderScheduler());
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockPostMessage).not.toHaveBeenCalled();
  });
});
