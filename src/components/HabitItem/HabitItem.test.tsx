import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitItem } from './HabitItem';

const habit = { id: '1', name: 'Медитація', color: '#7CB9A8', createdAt: '2026-06-01' };

it('renders habit name', () => {
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onArchive={vi.fn()} />);
  expect(screen.getByText('Медитація')).toBeInTheDocument();
});

it('calls onToggle when circle button clicked', async () => {
  const onToggle = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={onToggle} onArchive={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /виконати/i }));
  expect(onToggle).toHaveBeenCalledOnce();
});

it('shows checkmark and strikethrough when done', () => {
  render(<HabitItem habit={habit} done={true} onToggle={vi.fn()} onArchive={vi.fn()} />);
  expect(screen.getByText('Медитація')).toHaveStyle({ textDecoration: 'line-through' });
});
