import { DatasetDefinition, DatasetTable } from './types';
import { studentsDataset } from './students';
import { employeesDataset } from './employees';
import { shopDataset } from './shop';
import { bankDataset } from './bank';

const REGISTRY: Record<string, DatasetDefinition> = {
  [studentsDataset.key]: studentsDataset,
  [employeesDataset.key]: employeesDataset,
  [shopDataset.key]: shopDataset,
  [bankDataset.key]: bankDataset,
};

export function getDataset(key: string): DatasetDefinition {
  const dataset = REGISTRY[key];
  if (!dataset) {
    throw new Error(`Unknown dataset "${key}".`);
  }
  return dataset;
}

export function listDatasetKeys(): string[] {
  return Object.keys(REGISTRY);
}

function sqlLiteral(value: string | number | null): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

function buildTableSetupSql(table: DatasetTable): string {
  const createSql = `CREATE TABLE ${table.name} (${table.columnDefs});`;
  if (table.rows.length === 0) return createSql;

  const valuesList = table.rows.map((row) => `(${row.map(sqlLiteral).join(', ')})`).join(',\n  ');
  const insertSql = `INSERT INTO ${table.name} (${table.columns.join(', ')}) VALUES\n  ${valuesList};`;
  return `${createSql}\n${insertSql}`;
}

/** Full CREATE TABLE + INSERT script for every table in a dataset, run once per sandbox execution. */
export function buildDatasetSetupSql(datasetKey: string): string {
  const dataset = getDataset(datasetKey);
  return dataset.tables.map(buildTableSetupSql).join('\n\n');
}

/**
 * Same as buildDatasetSetupSql, but for one or more dataset keys combined into a single
 * setup script — used by exercises (mainly in the Set Operations section) whose query
 * spans tables that live in two different datasets, e.g. `students` and `shop`'s
 * `customers`. Table names must be unique across every dataset in the registry for this
 * to be safe; today's datasets (students / employees+departments / customers+products+
 * orders+order_items) don't collide, but keep that in mind before adding a new one.
 */
export function buildCombinedSetupSql(datasetKeys: string[]): string {
  return datasetKeys.map(buildDatasetSetupSql).join('\n\n');
}

export interface DatasetPreview {
  label: string;
  table: string;
  columns: string[];
  rows: Array<Array<string | number | null>>;
  totalRows: number;
}

/** Preview rows for the "DATABASE" card shown alongside an exercise. */
export function getDatasetPreview(datasetKey: string, limit = 6): DatasetPreview {
  const dataset = getDataset(datasetKey);
  const table = dataset.tables.find((t) => t.name === dataset.previewTable) ?? dataset.tables[0];
  return {
    label: dataset.label,
    table: table.name,
    columns: table.columns,
    rows: table.rows.slice(0, limit),
    totalRows: table.rows.length,
  };
}
