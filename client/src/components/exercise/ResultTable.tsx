interface ResultTableProps {
  columns: string[];
  rows: Array<Array<string | number | null>> | unknown[][];
  truncated?: boolean;
  totalRows?: number;
  emptyLabel?: string;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  return String(value);
}

export function ResultTable({ columns, rows, truncated, totalRows, emptyLabel }: ResultTableProps) {
  if (columns.length === 0) {
    return <p className="py-6 text-center text-sm text-text-dim">{emptyLabel ?? 'No columns returned.'}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-line">
      <table className="w-full min-w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-line bg-panel2">
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-3 py-2 font-mono font-semibold text-cyan">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-text-dim">
                No rows.
              </td>
            </tr>
          ) : (
            (rows as unknown[][]).map((row, i) => (
              <tr key={i} className="border-b border-line/60 last:border-0 odd:bg-transparent even:bg-panel2/40">
                {row.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap px-3 py-1.5 font-mono text-text">
                    {formatCell(cell)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {truncated && (
        <div className="border-t border-line px-3 py-1.5 text-xs text-text-dim">
          Showing a truncated preview{totalRows ? ` of ${totalRows} total rows` : ''}.
        </div>
      )}
    </div>
  );
}
