import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import { useLevels } from '@/hooks/useLevels';
import { useProgress } from '@/hooks/useProgress';
import { useMe } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import type { LevelState } from '@/types/api';

const STATE_ICON: Record<LevelState, ReactNode> = {
  completed: <Check className="h-3.5 w-3.5 text-green" />,
  current: <span className="h-2 w-2 rounded-full bg-amber" />,
  available: <span className="h-2 w-2 rounded-full bg-cyan" />,
  locked: <Lock className="h-3 w-3 text-text-dim" />,
};

export function Sidebar() {
  const { data: user } = useMe();
  const { data: levels } = useLevels(Boolean(user));
  const { data: progress } = useProgress();
  const params = useParams<{ levelId?: string }>();

  if (!user) return null;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-panel">
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {levels?.map((level) => {
          const locked = level.state === 'locked';
          const isActive = params.levelId === level.levelId;
          const href = locked ? undefined : level.state === 'completed' ? `/levels/${level.levelId}/review` : '/learn';

          const content = (
            <>
              <span className="flex h-5 w-5 items-center justify-center">{STATE_ICON[level.state]}</span>
              <span className={cn('truncate text-[13px]', locked ? 'text-text-dim' : 'text-text')}>{level.title}</span>
            </>
          );

          return locked || !href ? (
            <div key={level.levelId} className="flex cursor-not-allowed items-center gap-2.5 rounded-[7px] px-2.5 py-2 opacity-50">
              {content}
            </div>
          ) : (
            <Link
              key={level.levelId}
              to={href}
              className={cn(
                'flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 transition-colors hover:bg-panel2',
                isActive && 'bg-panel2'
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {progress && (
        <div className="border-t border-line p-4 text-[13px]">
          <div className="flex items-center justify-between text-text-dim">
            <span>XP</span>
            <span className="font-mono font-semibold text-amber">{progress.xp}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-text-dim">
            <span>Streak</span>
            <span className="font-mono font-semibold text-cyan">{progress.streak}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
