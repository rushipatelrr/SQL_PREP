import { Schema, model, Document, Types } from 'mongoose';

export type CourseStage = 'theory' | 'practice';
export type AttemptMode = 'course' | 'practice';

export interface IActiveAttempt {
  exerciseId: string;
  mode: AttemptMode;
  attempts: number;
  hintsUsed: number;
  solutionRevealed: boolean;
}

export interface IPracticeSession {
  levelId: string;
  exerciseIndex: number;
}

export interface IProgress extends Document {
  userId: Types.ObjectId;

  // --- Historical / permanent record. Never destroyed by logout or Practice Again. ---
  completedExercises: string[];
  completedLevels: string[];
  xp: number;
  streak: number;
  achievements: string[]; // extensibility point — not populated by the current curriculum
  mastery: Map<string, number>; // extensibility point, keyed by concept (e.g. "SELECT")

  // --- Current course position (the authoritative "resume here" pointer). ---
  currentLevelId: string;
  currentExerciseId: string;
  courseStage: CourseStage;
  courseTopicIndex: number;
  allLevelsCompleted: boolean;

  // --- Transient, in-progress state. Safe to reset; never affects the historical record. ---
  activeAttempt: IActiveAttempt | null;
  practiceSession: IPracticeSession | null;

  themePreference?: 'dark' | 'light';

  createdAt: Date;
  updatedAt: Date;
}

const activeAttemptSchema = new Schema<IActiveAttempt>(
  {
    exerciseId: { type: String, required: true },
    mode: { type: String, enum: ['course', 'practice'], required: true },
    attempts: { type: Number, required: true, default: 0 },
    hintsUsed: { type: Number, required: true, default: 0 },
    solutionRevealed: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const practiceSessionSchema = new Schema<IPracticeSession>(
  {
    levelId: { type: String, required: true },
    exerciseIndex: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const progressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    completedExercises: { type: [String], default: [] },
    completedLevels: { type: [String], default: [] },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    achievements: { type: [String], default: [] },
    mastery: { type: Map, of: Number, default: () => new Map() },

    currentLevelId: { type: String, required: true },
    currentExerciseId: { type: String, required: true },
    courseStage: { type: String, enum: ['theory', 'practice'], required: true, default: 'theory' },
    courseTopicIndex: { type: Number, required: true, default: 0 },
    allLevelsCompleted: { type: Boolean, required: true, default: false },

    activeAttempt: { type: activeAttemptSchema, default: null },
    practiceSession: { type: practiceSessionSchema, default: null },

    themePreference: { type: String, enum: ['dark', 'light'] },
  },
  { timestamps: true }
);


export const Progress = model<IProgress>('Progress', progressSchema);
