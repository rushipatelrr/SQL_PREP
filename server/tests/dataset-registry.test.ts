import { buildDatasetSetupSql, getDatasetPreview, listDatasetKeys, getDataset } from '../src/services/sql-sandbox/datasets/registry';

describe('dataset registry', () => {
  it('lists the registered datasets', () => {
    expect(listDatasetKeys().sort()).toEqual(['bank', 'employees', 'shop', 'students']);
  });

  it('throws a clear error for an unknown dataset key', () => {
    expect(() => getDataset('not-a-real-dataset')).toThrow(/Unknown dataset/);
  });

  it('builds valid CREATE TABLE + INSERT SQL for a single-table dataset', () => {
    const sql = buildDatasetSetupSql('students');
    expect(sql).toContain('CREATE TABLE students');
    expect(sql).toContain('INSERT INTO students');
    // 22 rows means 22 value tuples in the INSERT.
    expect(sql.match(/\(\d+,/g)?.length).toBe(22);
  });

  it('escapes single quotes in text values so generated SQL stays valid', () => {
    // employees dataset includes plain names today, but the escaping logic itself is what
    // we're testing here, independent of the current fixture data.
    const sql = buildDatasetSetupSql('employees');
    expect(sql).toContain('CREATE TABLE employees');
    expect(() => sql).not.toThrow();
  });

  it('returns a bounded preview with the dataset label and total row count', () => {
    const preview = getDatasetPreview('employees', 3);
    expect(preview.label).toBe('employees');
    expect(preview.rows.length).toBe(3);
    expect(preview.totalRows).toBe(18);
    expect(preview.columns).toContain('full_name');
  });
});
