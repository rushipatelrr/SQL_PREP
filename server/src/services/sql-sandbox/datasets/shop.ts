import { DatasetDefinition } from './types';

// A small, hand-authored e-commerce schema: customers place orders, orders contain line
// items, line items reference products. Deliberately includes the "gaps" that make
// subqueries and joins actually interesting to teach: one customer (Noah Bennett, id 10)
// has never placed an order, one order was cancelled, and one order is still pending.
//
// Every id referenced as a foreign key below exists in its target table — this data is
// hand-checked for referential integrity, since a broken reference would silently produce
// wrong (not erroring) results in a join.

const customers: Array<[number, string, string, string]> = [
  [1, 'Ella Martin', 'London', '2021-03-14'],
  [2, 'Raj Patel', 'Mumbai', '2020-11-02'],
  [3, 'Sofia Rossi', 'Paris', '2022-01-20'],
  [4, 'Kenji Sato', 'Tokyo', '2019-07-08'],
  [5, 'Amara Obi', 'Lagos', '2022-06-15'],
  [6, 'Liu Wei', 'Toronto', '2021-09-30'],
  [7, 'Mia Fischer', 'Berlin', '2020-02-11'],
  [8, 'Diego Alvarez', 'Toronto', '2023-01-05'],
  [9, 'Grace Adeyemi', 'Lagos', '2021-12-01'],
  [10, 'Noah Bennett', 'London', '2022-08-19'], // never placed an order
];

const products: Array<[number, string, string, number]> = [
  [1, 'Wireless Mouse', 'Electronics', 25.99],
  [2, 'Mechanical Keyboard', 'Electronics', 89.99],
  [3, 'USB-C Cable', 'Electronics', 9.99],
  [4, 'Notebook', 'Stationery', 3.49],
  [5, 'Fountain Pen', 'Stationery', 15.0],
  [6, 'Desk Lamp', 'Home', 34.5],
  [7, 'Coffee Mug', 'Home', 12.0],
  [8, 'Backpack', 'Accessories', 49.99],
  [9, 'Water Bottle', 'Accessories', 18.5],
  [10, 'Monitor Stand', 'Electronics', 29.99],
  [11, 'Desk Organizer', 'Home', 22.0], // never appears in any order — used for "never ordered" exercises
];

// status is one of 'completed', 'cancelled', 'pending'
const orders: Array<[number, number, string, string]> = [
  [1, 1, '2023-01-10', 'completed'],
  [2, 2, '2023-01-15', 'completed'],
  [3, 1, '2023-02-02', 'cancelled'],
  [4, 3, '2023-02-10', 'completed'],
  [5, 4, '2023-02-14', 'completed'],
  [6, 5, '2023-03-01', 'completed'],
  [7, 2, '2023-03-05', 'pending'],
  [8, 6, '2023-03-12', 'completed'],
  [9, 7, '2023-03-20', 'completed'],
  [10, 1, '2023-04-01', 'completed'],
  [11, 8, '2023-04-05', 'cancelled'],
  [12, 3, '2023-04-10', 'completed'],
  [13, 9, '2023-04-15', 'pending'],
  [14, 5, '2023-05-10', 'completed'],
];

const orderItems: Array<[number, number, number, number]> = [
  [1, 1, 1, 2],
  [2, 1, 3, 1],
  [3, 2, 2, 1],
  [4, 3, 4, 3],
  [5, 4, 6, 1],
  [6, 4, 7, 2],
  [7, 5, 8, 1],
  [8, 6, 1, 1],
  [9, 6, 9, 2],
  [10, 7, 2, 1],
  [11, 8, 10, 1],
  [12, 9, 5, 4],
  [13, 10, 3, 5],
  [14, 11, 8, 1],
  [15, 12, 6, 2],
  [16, 13, 4, 10],
  [17, 14, 9, 3],
];

const auditLog: Array<[number, string, string]> = [
  [1, 'order_created', '2023-01-10'],
  [2, 'order_created', '2023-01-15'],
  [3, 'order_cancelled', '2023-02-02'],
];

export const shopDataset: DatasetDefinition = {
  key: 'shop',
  label: 'shop',
  previewTable: 'orders',
  tables: [
    {
      name: 'customers',
      columnDefs: 'id INTEGER, name TEXT, city TEXT, signup_date TEXT',
      columns: ['id', 'name', 'city', 'signup_date'],
      rows: customers,
    },
    {
      name: 'products',
      columnDefs: 'id INTEGER, name TEXT, category TEXT, price REAL',
      columns: ['id', 'name', 'category', 'price'],
      rows: products,
    },
    {
      name: 'orders',
      columnDefs: 'id INTEGER, customer_id INTEGER, order_date TEXT, status TEXT',
      columns: ['id', 'customer_id', 'order_date', 'status'],
      rows: orders,
    },
    {
      name: 'order_items',
      columnDefs: 'id INTEGER, order_id INTEGER, product_id INTEGER, quantity INTEGER',
      columns: ['id', 'order_id', 'product_id', 'quantity'],
      rows: orderItems,
    },
    {
      // Used only by the Table Management section (CREATE/ALTER/DROP practice) — kept
      // separate from the core business tables so those exercises never have to touch
      // (or sound like they're destroying) real order/customer/product data.
      name: 'audit_log',
      columnDefs: 'id INTEGER, action TEXT, created_at TEXT',
      columns: ['id', 'action', 'created_at'],
      rows: auditLog,
    },
  ],
};
