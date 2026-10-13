import { apiFetch } from './client';
import type { ProgressDTO } from '@/types/api';

export async function fetchProgress(): Promise<ProgressDTO> {
  return apiFetch<ProgressDTO>('/api/progress/me');
}

export async function startPractice(levelId: string): Promise<{ levelId: string; firstExerciseId: string }> {
  return apiFetch(`/api/practice/${encodeURIComponent(levelId)}/start`, { method: 'POST' });
}
