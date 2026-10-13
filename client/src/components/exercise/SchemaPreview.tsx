import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ResultTable } from './ResultTable';
import type { SchemaSample } from '@/types/api';

export function SchemaPreview({ schema }: { schema: SchemaSample }) {
  const hiddenCount = Math.max(0, schema.totalRows - schema.rows.length);
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Database <span className="font-mono text-text-dim">· {schema.table}</span>
        </CardTitle>
        <span className="text-xs text-text-dim">{schema.totalRows} rows total</span>
      </CardHeader>
      <ResultTable columns={schema.columns} rows={schema.rows} />
      {hiddenCount > 0 && <p className="mt-2 text-xs text-text-dim">… {hiddenCount} more rows not shown.</p>}
    </Card>
  );
}
