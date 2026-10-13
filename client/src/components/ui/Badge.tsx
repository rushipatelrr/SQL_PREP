import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type BadgeTone = 'amber' | 'cyan' | 'green' | 'red' | 'purple' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  amber: 'bg-amber/15 text-amber border-amber/30',
  cyan: 'bg-cyan/15 text-cyan border-cyan/30',
  green: 'bg-green/15 text-green border-green/30',
  red: 'bg-red/15 text-red border-red/30',
  purple: 'bg-purple/15 text-purple border-purple/30',
  neutral: 'bg-panel2 text-text-dim border-line',
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
