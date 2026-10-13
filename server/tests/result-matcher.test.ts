import { resultsMatch } from '../src/services/sql-sandbox/result-matcher';

describe('resultsMatch', () => {
  it('matches identical rows returned in a different order when order does not matter', () => {
    const verdict = resultsMatch(
      { columns: ['id', 'name'], rows: [[1, 'a'], [2, 'b']] },
      { columns: ['id', 'name'], rows: [[2, 'b'], [1, 'a']] },
      { order: false, exactColumns: true }
    );
    expect(verdict.ok).toBe(true);
  });

  it('fails when row order matters and the rows are reordered', () => {
    const verdict = resultsMatch(
      { columns: ['id'], rows: [[1], [2]] },
      { columns: ['id'], rows: [[2], [1]] },
      { order: true, exactColumns: false }
    );
    expect(verdict.ok).toBe(false);
  });

  it('fails on a row-count mismatch with a helpful reason', () => {
    const verdict = resultsMatch(
      { columns: ['id'], rows: [[1], [2], [3]] },
      { columns: ['id'], rows: [[1], [2]] },
      { order: false, exactColumns: false }
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toMatch(/2 row.*3 row/i);
  });

  it('is case-insensitive on text values', () => {
    const verdict = resultsMatch(
      { columns: ['city'], rows: [['London']] },
      { columns: ['city'], rows: [['LONDON']] },
      { order: false, exactColumns: false }
    );
    expect(verdict.ok).toBe(true);
  });

  it('checks column names/count only when exactColumns is true — row values are always compared positionally', () => {
    // Same single-column value both times, but the header label differs (e.g. an alias).
    const lenientVerdict = resultsMatch(
      { columns: ['name'], rows: [['Ravi A.']] },
      { columns: ['student_name'], rows: [['Ravi A.']] },
      { order: false, exactColumns: false }
    );
    expect(lenientVerdict.ok).toBe(true);

    const strictVerdict = resultsMatch(
      { columns: ['name'], rows: [['Ravi A.']] },
      { columns: ['student_name'], rows: [['Ravi A.']] },
      { order: false, exactColumns: true }
    );
    expect(strictVerdict.ok).toBe(false);
    expect(strictVerdict.reason).toMatch(/column mismatch/i);
  });
});
