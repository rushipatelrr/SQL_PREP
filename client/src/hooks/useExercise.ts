import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchExercise, submitExercise, requestHint, revealSolution } from '@/api/exercises';
import { queryKeys } from '@/api/queryKeys';
import type { AttemptMode } from '@/types/api';

export function useExercise(exerciseId: string | null, mode: AttemptMode) {
  return useQuery({
    queryKey: queryKeys.exercise(exerciseId ?? '', mode),
    queryFn: () => fetchExercise(exerciseId as string, mode),
    enabled: Boolean(exerciseId),
  });
}

export function useSubmitExercise(exerciseId: string, mode: AttemptMode) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sql: string) => submitExercise(exerciseId, sql, mode),
    onSuccess: (result) => {
      // A correct submission changes attempt state, XP, and possibly the current
      // exercise/level — refetch both so the UI (sidebar, header XP, "next exercise")
      // reflects the server's authoritative state rather than being guessed client-side.
      if (result.correct) {
        queryClient.invalidateQueries({ queryKey: queryKeys.progress });
        queryClient.invalidateQueries({ queryKey: queryKeys.levels });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.exercise(exerciseId, mode) });
    },
  });
}

export function useRequestHint(exerciseId: string, mode: AttemptMode) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => requestHint(exerciseId, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exercise(exerciseId, mode) });
    },
  });
}

export function useRevealSolution(exerciseId: string, mode: AttemptMode) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => revealSolution(exerciseId, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exercise(exerciseId, mode) });
    },
  });
}
