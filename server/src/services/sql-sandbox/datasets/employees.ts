import { DatasetDefinition } from './types';

// A small, hand-authored company org chart: one CEO, five department heads reporting to
// her, and their direct reports. `manager_id` is nullable (the CEO has none) and self-
// references `id`, and `bonus` is nullable (not everyone got one this cycle) — both used
// for the IS NULL / IS NOT NULL lessons. Reused again later for GROUP BY, HAVING, string
// functions, date functions, CASE, and now joins/self-joins, so learners stay in one
// familiar schema rather than re-learning a new table every lesson.
//
// IMPORTANT: levels 10–16 already shipped exercises graded against these exact 18 rows
// (COUNT, AVG, GROUP BY, HAVING thresholds, etc.). Never add, remove, or change a value in
// an existing row — every one of those exercises' expected results depends on this data
// staying byte-for-byte the same. `department_id` below is a new *column*, added for the
// Joins section; existing exercises only ever selected specific columns or used SELECT *
// (which picks up new columns identically on both the learner's and the reference query),
// so adding a column here is safe. The mapping matches the existing `department` text
// column exactly: Executive=1, Engineering=2, Sales=3, Marketing=4, Support=5, Finance=6.
const rows: Array<[number, string, string, number, number | null, string, number | null, number]> = [
  [1, 'Grace Chen', 'Executive', 220000, null, '2015-01-12', 20000, 1],
  [2, 'Marcus Webb', 'Engineering', 165000, 1, '2016-03-04', 15000, 2],
  [3, 'Priya Nair', 'Sales', 150000, 1, '2017-06-19', 12000, 3],
  [4, 'Daniel Osei', 'Engineering', 128000, 2, '2018-02-11', 8000, 2],
  [5, 'Helen Kim', 'Engineering', 132000, 2, '2018-09-23', 8000, 2],
  [6, 'Tom Reilly', 'Engineering', 97000, 2, '2020-01-15', null, 2],
  [7, 'Ana Duarte', 'Sales', 88000, 3, '2019-04-02', 6000, 3],
  [8, 'Ben Farrow', 'Sales', 91000, 3, '2020-11-30', null, 3],
  [9, 'Ines Torres', 'Sales', 76000, 3, '2021-07-08', 4000, 3],
  [10, 'Omar Farouk', 'Marketing', 102000, 1, '2017-10-01', 9000, 4],
  [11, 'Lucy Adams', 'Marketing', 79000, 10, '2019-03-17', null, 4],
  [12, 'Ravi Menon', 'Marketing', 84000, 10, '2021-05-25', 3000, 4],
  [13, 'Sara Novak', 'Support', 68000, 1, '2018-12-05', null, 5],
  [14, 'Jack Byrne', 'Support', 71000, 13, '2020-06-14', 2000, 5],
  [15, 'Mei Lin', 'Support', 65000, 13, '2022-01-09', null, 5],
  [16, 'Carlos Ruiz', 'Finance', 112000, 1, '2016-08-20', 7000, 6],
  [17, 'Nadia Popov', 'Finance', 95000, 16, '2019-09-11', 5000, 6],
  [18, 'Oscar Bell', 'Finance', 89000, 16, '2022-03-30', null, 6],
];

// One extra department with nobody in it yet — gives LEFT/RIGHT/FULL JOIN a genuine
// unmatched row to demonstrate, without touching the employees table above at all.
const departmentRows: Array<[number, string, string, number]> = [
  [1, 'Executive', 'HQ - Floor 10', 500000],
  [2, 'Engineering', 'HQ - Floor 5', 2000000],
  [3, 'Sales', 'HQ - Floor 3', 900000],
  [4, 'Marketing', 'HQ - Floor 3', 600000],
  [5, 'Support', 'Remote', 400000],
  [6, 'Finance', 'HQ - Floor 4', 350000],
  [7, 'Legal', 'HQ - Floor 6', 200000],
];

export const employeesDataset: DatasetDefinition = {
  key: 'employees',
  label: 'employees',
  previewTable: 'employees',
  tables: [
    {
      name: 'employees',
      columnDefs:
        'id INTEGER, full_name TEXT, department TEXT, salary INTEGER, manager_id INTEGER, hire_date TEXT, bonus INTEGER, department_id INTEGER',
      columns: ['id', 'full_name', 'department', 'salary', 'manager_id', 'hire_date', 'bonus', 'department_id'],
      rows,
    },
    {
      name: 'departments',
      columnDefs: 'id INTEGER, name TEXT, location TEXT, budget INTEGER',
      columns: ['id', 'name', 'location', 'budget'],
      rows: departmentRows,
    },
  ],
};

