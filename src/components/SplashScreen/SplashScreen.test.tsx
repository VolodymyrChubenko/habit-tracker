import { render, screen, fireEvent, act } from '@testing-library/react';
import { SplashScreen } from './SplashScreen';

afterEach(() => {
  vi.useRealTimers();
});

it('renders the tagline', () => {
  render(<SplashScreen onDone={vi.fn()} />);
  expect(screen.getByLabelText('IMPROVE YOURSELF')).toBeInTheDocument();
});

it('calls onDone after the full sequence', () => {
  vi.useFakeTimers();
  const onDone = vi.fn();
  render(<SplashScreen onDone={onDone} />);
  expect(onDone).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(3700); });
  expect(onDone).toHaveBeenCalledOnce();
});

it('skips to onDone on tap', () => {
  vi.useFakeTimers();
  const onDone = vi.fn();
  const { container } = render(<SplashScreen onDone={onDone} />);
  fireEvent.click(container.firstChild as Element);
  act(() => { vi.advanceTimersByTime(300); });
  expect(onDone).toHaveBeenCalledOnce();
});

it('calls onDone immediately when reduced motion is preferred', () => {
  const mql = {
    matches: true, media: '', onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  } as unknown as MediaQueryList;
  const spy = vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
  const onDone = vi.fn();
  render(<SplashScreen onDone={onDone} />);
  expect(onDone).toHaveBeenCalledOnce();
  spy.mockRestore();
});
