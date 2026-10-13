import { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { TheoryViewer } from '@/components/theory/TheoryViewer';
import { ExercisePanel } from '@/components/exercise/ExercisePanel';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { FeedbackBanner } from '@/components/exercise/FeedbackBanner';
import { useProgress } from '@/hooks/useProgress';
import { useLevel } from '@/hooks/useLevels';

type LocalView = 'theory' | 'exercise';

export function CoursePage() {
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: level, isLoading: levelLoading } = useLevel(progress?.currentLevelId ?? null);

  // The server's courseStage is the default on first load of a level; once the learner
  // clicks "start exercises" we track that locally so flipping between topics doesn't
  // bounce them back. A level completing moves to a *different* level/courseStage from the
  // server, which resets this back to following the server again (see the effect below).
  const [localView, setLocalView] = useState<LocalView | null>(null);
  const [justLeveledUp, setJustLeveledUp] = useState(false);

  useEffect(() => {
    setLocalView(null);
  }, [progress?.currentLevelId]);

  if (progressLoading || levelLoading || !progress || !level) return <FullPageSpinner />;

  if (progress.allLevelsCompleted) {
    return (
      <Card className="flex flex-col items-center gap-3 border-amber/30 bg-amber/10 py-10 text-center">
        <PartyPopper className="h-10 w-10 text-amber" />
        <p className="text-lg font-semibold text-text">You&apos;ve completed SQL PREP!</p>
        <p className="text-sm text-text-dim">Every level is done. Revisit any of them from the sidebar any time.</p>
      </Card>
    );
  }

  const effectiveView: LocalView = localView ?? (progress.courseStage === 'theory' ? 'theory' : 'exercise');

  return (
    <div className="space-y-4">
      {justLeveledUp && (
        <FeedbackBanner kind="success" title={`Level complete — welcome to ${level.title}!`} detail="New theory below." />
      )}

      {effectiveView === 'theory' ? (
        <TheoryViewer topics={level.topics} onFinish={() => setLocalView('exercise')} />
      ) : (
        <ExercisePanel
          exerciseId={progress.currentExerciseId}
          mode="course"
          levelTopics={level.topics}
          onCorrect={(result) => {
            if (result.mode === 'course' && result.levelCompleted && result.nextLevelId) {
              setJustLeveledUp(true);
              setLocalView(null); // let the new level's theory show
              setTimeout(() => setJustLeveledUp(false), 4000);
            }
          }}
        />
      )}
    </div>
  );
}
