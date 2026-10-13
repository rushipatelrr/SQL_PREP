import { cn } from '@/utils/cn';

export function ExerciseProgressDots({ total, currentIndex }: { total: number; currentIndex: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors',
            i < currentIndex ? 'bg-green' : i === currentIndex ? 'bg-amber' : 'bg-line'
          )}
        />
      ))}
    </div>
  );
}
