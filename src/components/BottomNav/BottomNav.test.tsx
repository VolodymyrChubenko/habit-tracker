import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from './BottomNav';

const renderNav = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav />
    </MemoryRouter>,
  );

it('renders four nav items', () => {
  renderNav();
  expect(screen.getByText('Сьогодні')).toBeInTheDocument();
  expect(screen.getByText('Статистика')).toBeInTheDocument();
  expect(screen.getByText('Досягнення')).toBeInTheDocument();
  expect(screen.getByText('Налаштування')).toBeInTheDocument();
});

it('renders the central add button', () => {
  renderNav();
  expect(screen.getByLabelText('Додати челендж')).toBeInTheDocument();
});

it('marks Today as active on /', () => {
  renderNav('/');
  expect(screen.getByText('Сьогодні').closest('a')).toHaveClass('active');
});

it('marks Statistics as active on /statistics', () => {
  renderNav('/statistics');
  expect(screen.getByText('Статистика').closest('a')).toHaveClass('active');
});

it('marks Achievements as active on /achievements', () => {
  renderNav('/achievements');
  expect(screen.getByText('Досягнення').closest('a')).toHaveClass('active');
});
