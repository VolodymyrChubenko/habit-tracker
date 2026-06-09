import { useRef, type TouchEvent } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

interface Options {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

export const useSwipe = ({ onSwipeLeft, onSwipeRight, threshold = 50 }: Options): SwipeHandlers => {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = (e: TouchEvent): void => {
    startX.current = e.changedTouches[0].clientX;
    startY.current = e.changedTouches[0].clientY;
  };

  const onTouchEnd = (e: TouchEvent): void => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;

    // ігноруємо вертикальні свайпи (скрол), реагуємо лише на горизонтальні
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;

    dx < 0 ? onSwipeLeft() : onSwipeRight();
  };

  return { onTouchStart, onTouchEnd };
};
