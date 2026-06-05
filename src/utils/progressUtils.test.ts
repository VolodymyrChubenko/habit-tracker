import { describe, it, expect } from 'vitest';
import { calcOffset, CIRCUMFERENCE } from './progressUtils';

describe('calcOffset', () => {
  it('returns 0 for full progress (all done)', () => {
    expect(calcOffset(1)).toBe(0);
  });

  it('returns full circumference for zero progress', () => {
    expect(calcOffset(0)).toBeCloseTo(CIRCUMFERENCE);
  });

  it('returns half circumference for 0.5 progress', () => {
    expect(calcOffset(0.5)).toBeCloseTo(CIRCUMFERENCE * 0.5);
  });
});
