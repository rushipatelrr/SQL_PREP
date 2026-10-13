import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Flame, PartyPopper } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useLevels } from '@/hooks/useLevels';
import { useProgress } from '@/hooks/useProgress';
import { useMe } from '@/hooks/useAuth';

export function DashboardPage() {
  const { data: user } = useMe();
  const { data: levels, isLoading: levelsLoading } = useLevels(Boolean(user));
  const { data: progress, isLoading: progressLoading } = useProgress();

  if (levelsLoading || progressLoading || !levels || !progress) return <FullPageSpinner />;

  const currentLevel = levels.find((l) => l.levelId === progress.currentLevelId);
  const completedCount = levels.filter((l) => l.state === 'completed').length;
  const overallPct = levels.length > 0 ? (completedCount / levels.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}</h1>
        <p className="mt-1 text-sm text-text-dim">Here&apos;s where you stand in SQL PREP.</p>
      </div>

      {progress.allLevelsCompleted ? (
        <Card className="flex items-center gap-4 border-amber/30 bg-amber/10">
          <PartyPopper className="h-8 w-8 text-amber" />
          <div>
            <p className="font-semibold text-text">You&apos;ve completed every level!</p>
            <p className="text-sm text-text-dim">Review any level any time, or jump into Practice Again.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-medium text-text">{currentLevel?.title ?? 'Level 1'}</p>
              <p className="mt-0.5 text-sm text-text-dim">
                {progress.courseStage === 'theory' ? 'Theory' : 'Exercise'} · Level {(currentLevel?.order ?? 0) + 1}
              </p>
            </div>
            <Link to="/learn">
              <Button>
                Continue
                <ArrowRight className="ml-1.5 inline h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2 text-text-dim">
            <Trophy className="h-4 w-4 text-amber" />
            <span className="text-xs font-semibold uppercase tracking-wide">XP</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-text">{progress.xp}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-text-dim">
            <Flame className="h-4 w-4 text-cyan" />
            <span className="text-xs font-semibold uppercase tracking-wide">Streak</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-text">{progress.streak}</p>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-text-dim">Levels completed</div>
          <p className="mt-2 font-mono text-2xl font-semibold text-text">
            {completedCount}
            <span className="text-base text-text-dim"> / {levels.length}</span>
          </p>
          <ProgressBar value={overallPct} className="mt-2.5" />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed levels</CardTitle>
        </CardHeader>
        {completedCount === 0 ? (
          <p className="text-sm text-text-dim">Complete your first level to see it here.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {levels
              .filter((l) => l.state === 'completed')
              .map((l) => (
                <Link key={l.levelId} to={`/levels/${l.levelId}/review`}>
                  <Badge tone="green" className="cursor-pointer normal-case">
                    {l.title}
                  </Badge>
                </Link>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
