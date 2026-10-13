import { z } from 'zod';

export const submitExerciseSchema = z.object({
  sql: z.string().min(1, 'Query cannot be empty.').max(2000, 'Query is too long.'),
  mode: z.enum(['course', 'practice']),
});

export const hintRequestSchema = z.object({
  mode: z.enum(['course', 'practice']),
});

export const startPracticeParamsSchema = z.object({
  levelId: z.string().min(1),
});

export type SubmitExerciseInput = z.infer<typeof submitExerciseSchema>;
export type HintRequestInput = z.infer<typeof hintRequestSchema>;
