import { assertSafeQuery, SqlGuardError } from '../src/services/sql-sandbox/query-guard';

describe('assertSafeQuery', () => {
  it('allows a plain SELECT', () => {
    expect(() => assertSafeQuery('SELECT * FROM students;')).not.toThrow();
  });

  it('allows a WITH (CTE) query', () => {
    expect(() => assertSafeQuery('WITH x AS (SELECT 1) SELECT * FROM x;')).not.toThrow();
  });

  it('rejects an empty query', () => {
    expect(() => assertSafeQuery('   ')).toThrow(SqlGuardError);
  });

  it('rejects stacked statements', () => {
    expect(() => assertSafeQuery('SELECT 1; DROP TABLE students;')).toThrow(SqlGuardError);
  });

  it.each(['INSERT INTO students VALUES (1);', 'UPDATE students SET age=1;', 'DELETE FROM students;', 'DROP TABLE students;', 'ATTACH DATABASE \'x\' AS y;', "PRAGMA table_info(students);"])(
    'rejects a %s statement',
    (sql) => {
      expect(() => assertSafeQuery(sql)).toThrow(SqlGuardError);
    }
  );

  it('rejects an overly long query', () => {
    const huge = 'SELECT ' + '1,'.repeat(2000) + '1;';
    expect(() => assertSafeQuery(huge)).toThrow(SqlGuardError);
  });

  describe('parameterized statement kinds (mutation-kind exercises)', () => {
    it('allows INSERT when the exercise expects insert', () => {
      expect(() => assertSafeQuery("INSERT INTO t VALUES (1);", 'insert')).not.toThrow();
    });

    it('allows UPDATE when the exercise expects update', () => {
      expect(() => assertSafeQuery('UPDATE t SET x = 1;', 'update')).not.toThrow();
    });

    it('allows DELETE when the exercise expects delete', () => {
      expect(() => assertSafeQuery('DELETE FROM t WHERE id = 1;', 'delete')).not.toThrow();
    });

    it('allows CREATE TABLE / ALTER TABLE / DROP TABLE for their matching kinds', () => {
      expect(() => assertSafeQuery('CREATE TABLE t (id INTEGER);', 'create_table')).not.toThrow();
      expect(() => assertSafeQuery('ALTER TABLE t ADD COLUMN y TEXT;', 'alter_table')).not.toThrow();
      expect(() => assertSafeQuery('DROP TABLE t;', 'drop_table')).not.toThrow();
    });

    it('rejects a statement that does not match the exercise\'s expected kind', () => {
      expect(() => assertSafeQuery('DELETE FROM t;', 'insert')).toThrow(SqlGuardError);
      expect(() => assertSafeQuery('SELECT * FROM t;', 'insert')).toThrow(SqlGuardError);
      expect(() => assertSafeQuery('DROP TABLE t;', 'alter_table')).toThrow(SqlGuardError);
    });

    it('still blocks PRAGMA/ATTACH/transaction control regardless of the allowed kind', () => {
      expect(() => assertSafeQuery("PRAGMA table_info(t);", 'select')).toThrow(SqlGuardError);
      expect(() => assertSafeQuery("ATTACH DATABASE 'x' AS y;", 'create_table')).toThrow(SqlGuardError);
      expect(() => assertSafeQuery('BEGIN;', 'select')).toThrow(SqlGuardError);
    });

    it('still blocks stacked statements even for mutation kinds', () => {
      expect(() => assertSafeQuery('INSERT INTO t VALUES (1); DROP TABLE t;', 'insert')).toThrow(SqlGuardError);
    });
  });
});
