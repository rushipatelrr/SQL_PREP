export const queryKeys = {
  me: ['me'] as const,
  progress: ['progress'] as const,
  levels: ['levels'] as const,
  level: (levelId: string) => ['levels', levelId] as const,
  exercise: (exerciseId: string, mode: string) => ['exercise', exerciseId, mode] as const,
};
