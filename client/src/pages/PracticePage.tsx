import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';
import { ExercisePanel } from '@/components/exercise/ExercisePanel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useLevel } from '@/hooks/useLevels';
import { useProgress } from '@/hooks/useProgress';

export function PracticePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { data: level, isLoading: levelLoading } = useLevel(levelId ?? null);
  const { data: progress, isLoading: progressLoading } = useProgress();
  const [practiceComplete, setPracticeComplete] = useState(false);

  if (levelLoading || progressLoading || !level) return <FullPageSpinner />;

  const session = progress?.practiceSession;
  const currentExerciseId =
    session && session.levelId === levelId ? level.exercises?.[session.exerciseIndex]?.exerciseId : undefined;

  if (practiceComplete || !currentExerciseId) {
    return (
      <Card className="flex flex-col items-center gap-3 border-green/30 bg-green/10 py-10 text-center">
        <PartyPopper className="h-10 w-10 text-green" />
        <p className="text-lg font-semibold text-text">Practice complete!</p>
        <p className="text-sm text-text-dim">
          Your historical completion, XP, and unlocks for <b>{level.title}</b> are unchanged — this was just reinforcement.
        </p>
        <Button onClick={() => navigate(`/levels/${levelId}/review`)}>Back to level</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Badge tone="purple">Practice Again · {level.title}</Badge>
      <ExercisePanel
        exerciseId={currentExerciseId}
        mode="practice"
        levelTopics={level.topics}
        onCorrect={(result) => {
          if (result.mode === 'practice' && result.practiceComplete) {
            setPracticeComplete(true);
          }
        }}
      />
    </div>
  );
}
