import { useState, useCallback, useRef } from 'react';

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((state: ToastState, durationMs = 4000) => {
    clearTimeout(timerRef.current);
    setToast(state);
    timerRef.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, show, dismiss };
};
