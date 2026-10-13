export interface SqlResult {
  columns: string[];
  rows: unknown[][];
}

export interface ValidateConfig {
  order: boolean;
  exactColumns: boolean;
}

export interface MatchVerdict {
  ok: boolean;
  reason?: string;
}

// Ported exactly from the prototype: numbers are rounded to 4 decimal places, strings are
// trimmed/lower-cased (comparison is case-insensitive, matching the original UX), and
// null/undefined become the literal string 'NULL' so it participates in equality checks.
function normalizeRows(rows: unknown[][]): unknown[][] {
  return rows.map((row) =>
    row.map((value) => {
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'number') return Math.round(value * 10000) / 10000;
      return String(value).trim().toLowerCase();
    })
  );
}

/**
 * Compares a learner's query result against the reference result, exactly matching the
 * original client-side logic: result-based (never string-matched against the reference
 * SQL text), with row order and exact-column checks driven by the exercise's `validate`
 * config.
 */
export function resultsMatch(
  expected: SqlResult,
  actual: SqlResult,
  cfg: ValidateConfig
): MatchVerdict {
  if (cfg.exactColumns) {
    const ec = expected.columns.map((c) => c.toLowerCase());
    const ac = actual.columns.map((c) => c.toLowerCase());
    if (ec.length !== ac.length) {
      return { ok: false, reason: `Expected ${ec.length} column(s), got ${ac.length}.` };
    }
    if (JSON.stringify(ec) !== JSON.stringify(ac)) {
      return { ok: false, reason: `Column mismatch — expected ${ec.join(', ')}, got ${ac.join(', ')}.` };
    }
  }

  let e = normalizeRows(expected.rows).map((r) => JSON.stringify(r));
  let a = normalizeRows(actual.rows).map((r) => JSON.stringify(r));

  if (!cfg.order) {
    e = [...e].sort();
    a = [...a].sort();
  }

  if (e.length !== a.length) {
    return {
      ok: false,
      reason: `Your query returned ${a.length} row(s). The expected result has ${e.length} row(s).`,
    };
  }
  for (let i = 0; i < e.length; i++) {
    if (e[i] !== a[i]) {
      return {
        ok: false,
        reason: cfg.order ? 'Rows matched but not in the required order.' : "Row values don't match the expected result.",
      };
    }
  }
  return { ok: true };
}
