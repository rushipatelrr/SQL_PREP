import { DatasetDefinition } from './types';

// A tiny retail-bank schema: accounts, and the deposits/withdrawals made against them.
// Hand-authored with deliberate edge cases the capstone queries lean on: one account is
// overdrawn (Chloe: 400 in, 550 out), one has never had a transaction (Farid), and several
// accounts have withdrawals over 500. Final balances (deposits minus withdrawals):
//   1 Alice 950 · 2 Bilal 4600 · 3 Chloe -150 · 4 Dmitri 1500 · 5 Elena 800 · 6 Farid 0
// Every account_id below exists in accounts — checked by hand, since a dangling reference
// would silently drop rows from a join rather than raising an error.

const accounts: Array<[number, string, string, string]> = [
  [1, 'Alice Morgan', 'checking', '2020-03-01'],
  [2, 'Bilal Khan', 'savings', '2019-07-15'],
  [3, 'Chloe Dubois', 'checking', '2021-01-20'],
  [4, 'Dmitri Ivanov', 'savings', '2022-05-05'],
  [5, 'Elena Rossi', 'checking', '2022-11-11'],
  [6, 'Farid Nasser', 'savings', '2023-02-02'],
];

// type is 'deposit' or 'withdrawal'; amount is always positive
const transactions: Array<[number, number, string, string, number]> = [
  [1, 1, '2023-01-05', 'deposit', 1500],
  [2, 1, '2023-01-12', 'withdrawal', 200],
  [3, 1, '2023-02-01', 'withdrawal', 650],
  [4, 1, '2023-02-15', 'deposit', 300],
  [5, 2, '2023-01-03', 'deposit', 5000],
  [6, 2, '2023-02-10', 'withdrawal', 1200],
  [7, 2, '2023-03-01', 'deposit', 800],
  [8, 3, '2023-01-20', 'deposit', 400],
  [9, 3, '2023-02-05', 'withdrawal', 550],
  [10, 4, '2023-01-25', 'deposit', 2500],
  [11, 4, '2023-02-25', 'withdrawal', 300],
  [12, 4, '2023-03-10', 'withdrawal', 700],
  [13, 5, '2023-03-05', 'deposit', 900],
  [14, 5, '2023-03-20', 'withdrawal', 100],
];

export const bankDataset: DatasetDefinition = {
  key: 'bank',
  label: 'bank',
  previewTable: 'transactions',
  tables: [
    {
      name: 'accounts',
      columnDefs: 'id INTEGER, holder_name TEXT, account_type TEXT, opened_on TEXT',
      columns: ['id', 'holder_name', 'account_type', 'opened_on'],
      rows: accounts,
    },
    {
      name: 'transactions',
      columnDefs: 'id INTEGER, account_id INTEGER, txn_date TEXT, type TEXT, amount INTEGER',
      columns: ['id', 'account_id', 'txn_date', 'type', 'amount'],
      rows: transactions,
    },
  ],
};
