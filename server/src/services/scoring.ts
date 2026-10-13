/**
 * Ported exactly from the prototype:
 *   let award = attempts===1 ? 100 : attempts===2 ? 70 : 40;
 *   award -= hintsUsed>=99 ? 50 : hintsUsed*10;   // 99 was a sentinel for "solution revealed"
 *   award = Math.max(award, 10);
 *
 * Here `solutionRevealed` is an explicit boolean instead of a magic 99 sentinel, but the
 * resulting numbers are identical: first try no hints = 100, second try = 70, third-plus = 40,
 * each hint costs 10, revealing the solution costs a flat 50, and the floor is always 10.
 */
export function computeAward(attempts: number, hintsUsed: number, solutionRevealed: boolean): number {
  const base = attempts <= 1 ? 100 : attempts === 2 ? 70 : 40;
  const penalty = solutionRevealed ? 50 : hintsUsed * 10;
  return Math.max(base - penalty, 10);
}
