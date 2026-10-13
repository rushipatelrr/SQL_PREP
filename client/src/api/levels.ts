import { apiFetch } from './client';
import type { LevelSummary, LevelDetail } from '@/types/api';

export async function fetchLevels(): Promise<LevelSummary[]> {
  const data = await apiFetch<{ levels: LevelSummary[] }>('/api/levels');
  return data.levels;
}

export async function fetchLevel(levelId: string): Promise<LevelDetail> {
  const data = await apiFetch<{ level: LevelDetail }>(`/api/levels/${encodeURIComponent(levelId)}`);
  return data.level;
}
