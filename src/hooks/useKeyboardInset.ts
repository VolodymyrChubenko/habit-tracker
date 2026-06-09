import { useEffect, useState } from 'react';

/** Висота екранної клавіатури в px (0 коли прихована). iOS VisualViewport. */
export const useKeyboardInset = (): number => {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = (): void => {
      const next = window.innerHeight - vv.height - vv.offsetTop;
      setInset(next > 0 ? next : 0);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
};
