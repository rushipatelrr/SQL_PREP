export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export type LevelState = 'completed' | 'current' | 'available' | 'locked';

export interface LevelSummary {
  levelId: string;
  order: number;
  title: string;
  concept: string;
  state: LevelState;
  topicCount: number;
  exerciseCount: number;
}

export interface TopicDTO {
  order: number;
  title: string;
  what: string;
  why?: string;
  syntax?: string;
  example?: string;
  exampleExplain?: string;
  example2?: string;
  example2Explain?: string;
  whenToUse?: string;
  mistake?: string;
  remember?: string[];
}

export interface LevelExerciseSummary {
  exerciseId: string;
  orderIndex: number;
  concept: string;
  prompt: string;
}

export interface LevelDetail extends LevelSummary {
  topics: TopicDTO[];
  exercises: LevelExerciseSummary[] | null;
}

export type AttemptMode = 'course' | 'practice';
export type ExerciseKind = 'query' | 'mutation';

export interface SchemaSample {
  table: string;
  columns: string[];
  rows: Array<Array<string | number | null>>;
  totalRows: number;
}

export interface ExerciseDetail {
  exercise: {
    exerciseId: string;
    levelId: string;
    orderIndex: number;
    totalInLevel: number;
    concept: string;
    prompt: string;
    hintsAvailable: number;
    kind: ExerciseKind;
    allowedStatement?: string;
  };
  level: { levelId: string; title: string; concept: string } | null;
  mode: AttemptMode;
  attempt: { attempts: number; hintsUsed: number; solutionRevealed: boolean };
  schemaSample: SchemaSample;
}

export interface ResultPreview {
  columns: string[];
  rows: unknown[][];
  truncated: boolean;
}

export interface IncorrectSubmission {
  correct: false;
  reason: string;
  resultPreview: ResultPreview;
}

export interface CourseSubmission {
  correct: true;
  mode: 'course';
  xpAwarded: number;
  totalXp: number;
  levelCompleted: boolean;
  allLevelsCompleted: boolean;
  nextExerciseId: string | null;
  nextLevelId: string | null;
}

export interface PracticeSubmission {
  correct: true;
  mode: 'practice';
  practiceComplete: boolean;
  nextExerciseId: string | null;
}

export type SubmissionResult = IncorrectSubmission | CourseSubmission | PracticeSubmission;

export interface HintResponse {
  hintNumber: number;
  hintText: string;
  hintsAvailable: number;
}

export interface SolutionResponse {
  sql: string;
  explanation: string;
}

export interface PracticeSessionDTO {
  levelId: string;
  exerciseIndex: number;
}

export interface ProgressDTO {
  currentLevelId: string;
  currentExerciseId: string;
  courseStage: 'theory' | 'practice';
  courseTopicIndex: number;
  completedExercises: string[];
  completedLevels: string[];
  xp: number;
  streak: number;
  achievements: string[];
  allLevelsCompleted: boolean;
  practiceSession: PracticeSessionDTO | null;
  themePreference: 'dark' | 'light' | null;
}

export interface ApiErrorBody {
  error: string;
}
