const RADIUS = 13;
export const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~81.68

export const calcOffset = (progress: number): number =>
  CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)));
