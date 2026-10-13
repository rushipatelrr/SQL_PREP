import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FeedbackBannerProps {
  kind: 'success' | 'error' | 'warning';
  title: string;
  detail?: string;
}

const KIND_STYLES = {
  success: { icon: CheckCircle2, classes: 'border-green/30 bg-green/10 text-green' },
  error: { icon: XCircle, classes: 'border-red/30 bg-red/10 text-red' },
  warning: { icon: AlertTriangle, classes: 'border-amber/30 bg-amber/10 text-amber' },
} as const;

export function FeedbackBanner({ kind, title, detail }: FeedbackBannerProps) {
  const { icon: Icon, classes } = KIND_STYLES[kind];
  return (
    <div className={cn('flex items-start gap-2.5 rounded-card border px-4 py-3 animate-swap-in', classes)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {detail && <p className="mt-0.5 text-sm opacity-90">{detail}</p>}
      </div>
    </div>
  );
}
