import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitItem } from './HabitItem';

const habit = { id: '1', name: 'Медитація', color: '#7CB9A8', createdAt: '2026-06-01', order: 0 };

afterEach(() => {
  vi.useRealTimers();
});

it('renders habit name', () => {
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.getByText('Медитація')).toBeInTheDocument();
});

it('defers onToggle until the complete animation finishes', () => {
  vi.useFakeTimers();
  const onToggle = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={onToggle} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /виконати/i }));
  expect(onToggle).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(750); });
  expect(onToggle).toHaveBeenCalledOnce();
});

it('does not call onToggle twice on a double click', () => {
  vi.useFakeTimers();
  const onToggle = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={onToggle} onEdit={vi.fn()} />);
  const btn = screen.getByRole('button', { name: /виконати/i });
  fireEvent.click(btn);
  fireEvent.click(btn);
  act(() => { vi.advanceTimersByTime(750); });
  expect(onToggle).toHaveBeenCalledOnce();
});

it('calls onToggle immediately when reduced motion is preferred', () => {
  const mql = {
    matches: true, media: '', onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  } as unknown as MediaQueryList;
  const spy = vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
  const onToggle = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={onToggle} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /виконати/i }));
  expect(onToggle).toHaveBeenCalledOnce();
  spy.mockRestore();
});

it('does not call onEdit when circle button clicked', () => {
  const onEdit = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onEdit={onEdit} />);
  fireEvent.click(screen.getByRole('button', { name: /виконати/i }));
  expect(onEdit).not.toHaveBeenCalled();
});

it('calls onEdit when card is clicked', async () => {
  const onEdit = vi.fn();
  render(<HabitItem habit={habit} done={false} onToggle={vi.fn()} onEdit={onEdit} />);
  await userEvent.click(screen.getByText('Медитація'));
  expect(onEdit).toHaveBeenCalledOnce();
});

it('shows strikethrough when done', () => {
  render(<HabitItem habit={habit} done={true} onToggle={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.getByText('Медитація')).toHaveStyle({ textDecoration: 'line-through' });
});
