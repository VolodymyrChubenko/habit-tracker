import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReminderBanner } from './ReminderBanner';
import { useChallengesStore } from '../../store/challengesStore';
import { useRemindersStore } from '../../store/remindersStore';
import { today } from '../../utils/dateUtils';
import type { Challenge } from '../../types';

const ch = (id: string, name: string, order: number, over: Partial<Challenge> = {}): Challenge => ({
  id,
  name,
  color: '#7CB9A8',
  createdAt: '2026-06-01',
  order,
  ...over,
});

beforeEach(() => {
  useChallengesStore.setState({
    challenges: [ch('a', 'Зарядка', 0), ch('b', 'Читання', 1), ch('c', 'Медитація', 2)],
    logs: [],
  });
  useRemindersStore.setState({ pendingIds: [] });
});

describe('ReminderBanner', () => {
  it('нічого не рендерить без нагадувань', () => {
    const { container } = render(<ReminderBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('показує всі накопичені нагадування', () => {
    useRemindersStore.setState({ pendingIds: ['a', 'b'] });
    render(<ReminderBanner />);
    expect(screen.getByText('Час виконати')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Зарядка' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Читання' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Медитація' })).not.toBeInTheDocument();
  });

  it('відсіює вже виконаний сьогодні челендж', () => {
    useChallengesStore.setState({
      logs: [{ challengeId: 'a', date: today(), completedAt: new Date().toISOString() }],
    });
    useRemindersStore.setState({ pendingIds: ['a', 'b'] });
    render(<ReminderBanner />);
    expect(screen.queryByRole('button', { name: 'Зарядка' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Читання' })).toBeInTheDocument();
  });

  it('відсіює заархівований челендж', () => {
    useChallengesStore.setState({
      challenges: [ch('a', 'Зарядка', 0, { archivedAt: '2026-08-01' })],
    });
    useRemindersStore.setState({ pendingIds: ['a'] });
    const { container } = render(<ReminderBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ігнорує id неіснуючого челенджа', () => {
    useRemindersStore.setState({ pendingIds: ['gone'] });
    const { container } = render(<ReminderBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('× ховає банер', async () => {
    useRemindersStore.setState({ pendingIds: ['a'] });
    const { container } = render(<ReminderBanner />);
    await userEvent.click(screen.getByLabelText('Сховати нагадування'));
    expect(container).toBeEmptyDOMElement();
    expect(useRemindersStore.getState().pendingIds).toEqual([]);
  });

  it('клік по імені скролить до картки челенджа', async () => {
    useRemindersStore.setState({ pendingIds: ['a'] });
    const card = document.createElement('div');
    card.id = 'challenge-a';
    const scrollIntoView = vi.fn();
    card.scrollIntoView = scrollIntoView;
    document.body.appendChild(card);

    render(<ReminderBanner />);
    await userEvent.click(screen.getByRole('button', { name: 'Зарядка' }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });

    card.remove();
  });
});
