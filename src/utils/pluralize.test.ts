import { describe, it, expect } from 'vitest';
import { dayWord } from './pluralize';

describe('dayWord', () => {
  it('1 → день', () => expect(dayWord(1)).toBe('день'));
  it('2 → дні', () => expect(dayWord(2)).toBe('дні'));
  it('4 → дні', () => expect(dayWord(4)).toBe('дні'));
  it('5 → днів', () => expect(dayWord(5)).toBe('днів'));
  it('11 → днів', () => expect(dayWord(11)).toBe('днів'));
  it('21 → день', () => expect(dayWord(21)).toBe('день'));
  it('111 → днів', () => expect(dayWord(111)).toBe('днів'));
  it('0 → днів', () => expect(dayWord(0)).toBe('днів'));
});
