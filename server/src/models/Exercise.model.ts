import { Schema, model } from 'mongoose';
import { AllowedStatementKind } from '../services/sql-sandbox/query-guard';

export interface IExerciseValidation {
  order: boolean; // does row order matter?
  exactColumns: boolean; // must returned columns match the reference exactly?
}

export type ExerciseKind = 'query' | 'mutation';

export interface IExercise {
  exerciseId: string; // stable id, e.g. "level-1-ex-1"
  levelId: string; // FK to Level.levelId
  orderIndex: number; // 0-based position within the level
  concept: string;
  datasetKey: string; // primary dataset this exercise runs against, e.g. "students", "employees"
  extraDatasetKeys?: string[]; // additional datasets combined into the same sandbox (e.g. set operations spanning two datasets)
  prompt: string; // author-trusted HTML fragment, safe to render as-is on the client

  // kind 'query' (default): sql is a SELECT/WITH statement, graded directly — the original
  // behavior. kind 'mutation': sql is a single INSERT/UPDATE/DELETE/CREATE/ALTER/DROP
  // statement (its exact allowed type given by allowedStatement); it's graded by running it
  // against a fresh sandbox, then running verifyQuery — always a trusted, author-written
  // SELECT — against the resulting state. The learner's and the reference's sql are each run
  // through this same setup-then-verify flow, and their verifyQuery results are compared.
  kind: ExerciseKind;
  allowedStatement?: AllowedStatementKind; // required when kind === 'mutation'
  verifyQuery?: string; // required when kind === 'mutation'; never learner input

  sql: string; // THE ANSWER — reference solution (query) or reference statement (mutation). Never sent to the client.
  validate: IExerciseValidation;
  hints: string[];
  explanation: string;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    exerciseId: { type: String, required: true, unique: true, index: true },
    levelId: { type: String, required: true, index: true },
    orderIndex: { type: Number, required: true },
    concept: { type: String, required: true },
    datasetKey: { type: String, required: true, default: 'students' },
    extraDatasetKeys: { type: [String], default: [] },
    prompt: { type: String, required: true },
    kind: { type: String, enum: ['query', 'mutation'], required: true, default: 'query' },
    allowedStatement: { type: String },
    verifyQuery: { type: String, select: false }, // author content, but no reason to send it to the client either
    sql: { type: String, required: true, select: false }, // excluded from queries by default
    validate: {
      order: { type: Boolean, required: true, default: false },
      exactColumns: { type: Boolean, required: true, default: false },
    },
    hints: { type: [String], default: [] },
    explanation: { type: String, required: true },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

exerciseSchema.index({ levelId: 1, orderIndex: 1 }, { unique: true });

export const Exercise = model<IExercise>('Exercise', exerciseSchema);
