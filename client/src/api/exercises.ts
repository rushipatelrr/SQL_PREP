import { apiFetch } from './client';
import type { AttemptMode, ExerciseDetail, HintResponse, SolutionResponse, SubmissionResult } from '@/types/api';

export async function fetchExercise(exerciseId: string, mode: AttemptMode): Promise<ExerciseDetail> {
  return apiFetch<ExerciseDetail>(`/api/exercises/${encodeURIComponent(exerciseId)}?mode=${mode}`);
}

export async function submitExercise(exerciseId: string, sql: string, mode: AttemptMode): Promise<SubmissionResult> {
  return apiFetch<SubmissionResult>(`/api/exercises/${encodeURIComponent(exerciseId)}/submit`, {
    method: 'POST',
    body: { sql, mode },
  });
}

export async function requestHint(exerciseId: string, mode: AttemptMode): Promise<HintResponse> {
  return apiFetch<HintResponse>(`/api/exercises/${encodeURIComponent(exerciseId)}/hint`, {
    method: 'POST',
    body: { mode },
  });
}

export async function revealSolution(exerciseId: string, mode: AttemptMode): Promise<SolutionResponse> {
  return apiFetch<SolutionResponse>(`/api/exercises/${encodeURIComponent(exerciseId)}/reveal-solution`, {
    method: 'POST',
    body: { mode },
  });
}
