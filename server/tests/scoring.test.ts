import { computeAward } from '../src/services/scoring';

describe('computeAward', () => {
  it('awards 100 for a correct first attempt with no hints', () => {
    expect(computeAward(1, 0, false)).toBe(100);
  });

  it('awards 70 for a correct second attempt with no hints', () => {
    expect(computeAward(2, 0, false)).toBe(70);
  });

  it('awards 40 for a third-or-later correct attempt with no hints', () => {
    expect(computeAward(3, 0, false)).toBe(40);
    expect(computeAward(7, 0, false)).toBe(40);
  });

  it('deducts 10 XP per hint used', () => {
    expect(computeAward(1, 1, false)).toBe(90);
    expect(computeAward(2, 1, false)).toBe(60);
  });

  it('never drops below the floor of 10', () => {
    expect(computeAward(5, 9, false)).toBe(10);
  });

  it('applies a flat 50-point penalty when the solution was revealed, regardless of hints', () => {
    expect(computeAward(1, 0, true)).toBe(50);
    expect(computeAward(1, 2, true)).toBe(50);
  });
});
