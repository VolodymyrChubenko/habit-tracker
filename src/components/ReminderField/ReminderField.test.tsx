import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReminderField } from './ReminderField';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const noop = () => {};

const renderField = (activeDays: number[], onActiveDaysChange = vi.fn()) => {
  render(
    <ReminderField
      enabled
      time="09:00"
      activeDays={activeDays}
      onToggle={noop}
      onTimeChange={noop}
      onActiveDaysChange={onActiveDaysChange}
    />,
  );
  return onActiveDaysChange;
};

describe('ReminderField — дні тижня', () => {
  it('клік по активному дню знімає його', () => {
    const onChange = renderField(ALL_DAYS);
    fireEvent.click(screen.getByRole('button', { name: 'Ср' }));
    expect(onChange).toHaveBeenCalledWith([0, 1, 3, 4, 5, 6]);
  });

  it('клік по неактивному дню додає його', () => {
    const onChange = renderField([0, 1]);
    fireEvent.click(screen.getByRole('button', { name: 'Ср' }));
    expect(onChange).toHaveBeenCalledWith([0, 1, 2]);
  });

  it('не дозволяє зняти останній вибраний день', () => {
    const onChange = renderField([2]);
    fireEvent.click(screen.getByRole('button', { name: 'Ср' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('відображає стан днів через aria-pressed', () => {
    renderField([0, 4]);
    expect(screen.getByRole('button', { name: 'Пн' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Пт' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Вт' })).toHaveAttribute('aria-pressed', 'false');
  });
});
