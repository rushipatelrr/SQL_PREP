import { DatasetDefinition } from './types';

// Ported exactly from the prototype's genStudents()/seededRandom(). Untouched since the
// original migration — do not edit the generation logic below; it must keep producing the
// exact same 22 rows the original client-side app used, byte for byte.

export interface StudentRow {
  id: number;
  name: string;
  age: number;
  city: string;
  gpa: number;
}

export const STUDENTS_SEED = 18372;

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next(): number {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function genStudents(seed: number = STUDENTS_SEED): StudentRow[] {
  const rnd = seededRandom(seed);
  const first = [
    'Ravi', 'Emma', 'John', 'Priya', 'Liam', 'Sofia', 'Noah', 'Aisha',
    'Mateo', 'Yuki', 'Chen', 'Zara', 'Leo', 'Nina', 'Omar',
  ];
  const cities = [
    'Mumbai', 'London', 'New York', 'Delhi', 'Paris',
    'Tokyo', 'Berlin', 'Toronto', 'Lagos', 'Cairo',
  ];
  const rows: StudentRow[] = [];
  for (let i = 1; i <= 22; i++) {
    rows.push({
      id: i,
      name: first[Math.floor(rnd() * first.length)] + ' ' + String.fromCharCode(65 + Math.floor(rnd() * 26)) + '.',
      age: 18 + Math.floor(rnd() * 12),
      city: cities[Math.floor(rnd() * cities.length)],
      gpa: Math.round((2 + rnd() * 2) * 100) / 100,
    });
  }
  return rows;
}

export const studentsDataset: DatasetDefinition = {
  key: 'students',
  label: 'students',
  tables: [
    {
      name: 'students',
      columnDefs: 'id INTEGER, name TEXT, age INTEGER, city TEXT, gpa REAL',
      columns: ['id', 'name', 'age', 'city', 'gpa'],
      rows: genStudents().map((r) => [r.id, r.name, r.age, r.city, r.gpa]),
    },
  ],
};
