import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}

export function ProgressBar({ value, className, trackClassName, barClassName }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-panel2', trackClassName, className)}>
      <div
        className={cn('h-full rounded-full bg-amber transition-[width] duration-300', barClassName)}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
