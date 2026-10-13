export interface DatasetTable {
  name: string;
  /** Column definitions as they appear in CREATE TABLE, e.g. "id INTEGER PRIMARY KEY". */
  columnDefs: string;
  /** Plain column names, in the same order as columnDefs — used for INSERT and schema previews. */
  columns: string[];
  /** Row values in `columns` order. Use `null` for SQL NULL. */
  rows: Array<Array<string | number | null>>;
}

export interface DatasetDefinition {
  key: string;
  /** Human-readable label for the schema preview panel, e.g. "Employees". */
  label: string;
  tables: DatasetTable[];
  /** Which table to show by default in the "DATABASE" preview card. Defaults to tables[0]. */
  previewTable?: string;
}
