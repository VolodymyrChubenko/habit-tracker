import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitItem } from './HabitItem';

const habit = { id: '1', name: 'Медитація', color: '#7CB9A8', createdAt: '2026-06-01', order: 0 };

it('renders habit name', () => {
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.getByText('Медитація')).toBeInTheDocument();
});

it('calls onToggle when circle button clicked', async () => {
  const onToggle = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={onToggle} onEdit={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /виконати/i }));
  expect(onToggle).toHaveBeenCalledOnce();
});

it('calls onEdit when card is clicked', async () => {
  const onEdit = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onEdit={onEdit} />);
  await userEvent.click(screen.getByText('Медитація'));
  expect(onEdit).toHaveBeenCalledOnce();
});

it('does not call onEdit when circle button clicked', async () => {
  const onEdit = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onEdit={onEdit} />);
  await userEvent.click(screen.getByRole('button', { name: /виконати/i }));
  expect(onEdit).not.toHaveBeenCalled();
});

it('shows checkmark and strikethrough when done', () => {
  render(<HabitItem habit={habit} done={true} onToggle={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.getByText('Медитація')).toHaveStyle({ textDecoration: 'line-through' });
});
