import { useQuery } from '@tanstack/react-query';
import { fetchLevels, fetchLevel } from '@/api/levels';
import { queryKeys } from '@/api/queryKeys';

export function useLevels(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.levels,
    queryFn: fetchLevels,
    enabled,
  });
}

export function useLevel(levelId: string | null) {
  return useQuery({
    queryKey: queryKeys.level(levelId ?? ''),
    queryFn: () => fetchLevel(levelId as string),
    enabled: Boolean(levelId),
  });
}
