import { useState } from 'react';
import { BookOpen, Play } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { SqlEditor } from './SqlEditor';
import { ResultTable } from './ResultTable';
import { SchemaPreview } from './SchemaPreview';
import { FeedbackBanner } from './FeedbackBanner';
import { HintPanel } from './HintPanel';
import { ExerciseProgressDots } from './ExerciseProgressDots';
import { TheoryOverlay } from '@/components/theory/TheoryOverlay';
import { useExercise, useSubmitExercise } from '@/hooks/useExercise';
import type { AttemptMode, TopicDTO, SubmissionResult } from '@/types/api';

interface ExercisePanelProps {
  exerciseId: string;
  mode: AttemptMode;
  levelTopics: TopicDTO[];
  /** Called once with the submission result right after a *correct* answer. */
  onCorrect: (result: Extract<SubmissionResult, { correct: true }>) => void;
}

export function ExercisePanel({ exerciseId, mode, levelTopics, onCorrect }: ExercisePanelProps) {
  const { data, isLoading } = useExercise(exerciseId, mode);
  const submitMutation = useSubmitExercise(exerciseId, mode);
  const [sql, setSql] = useState('');
  const [showTheory, setShowTheory] = useState(false);
  const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);

  if (isLoading || !data) return <FullPageSpinner />;

  const { exercise, schemaSample, attempt } = data;

  async function handleRun() {
    if (!sql.trim()) return;
    const result = await submitMutation.mutateAsync(sql);
    setLastResult(result);
    if (result.correct) {
      // Brief pause so the success feedback is actually seen before the view moves on.
      setTimeout(() => onCorrect(result), 700);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Badge tone="amber">{exercise.concept}</Badge>
          {mode === 'practice' && <Badge tone="purple">Practice</Badge>}
        </div>
        <ExerciseProgressDots total={exercise.totalInLevel} currentIndex={exercise.orderIndex} />
      </div>

      <Card>
        <p className="text-[15px] leading-relaxed text-text" dangerouslySetInnerHTML={{ __html: exercise.prompt }} />
      </Card>

      <SchemaPreview schema={schemaSample} />

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-dim">Your query</span>
          <button
            onClick={() => setShowTheory(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-purple transition-opacity hover:opacity-80"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Review Theory
          </button>
        </div>
        <SqlEditor value={sql} onChange={setSql} onRunShortcut={handleRun} />
        <div className="flex items-center justify-between">
          <Button onClick={handleRun} disabled={submitMutation.isPending || !sql.trim()}>
            {submitMutation.isPending ? <Spinner className="mr-1.5 inline" /> : <Play className="mr-1.5 inline h-3.5 w-3.5" />}
            Run
          </Button>
          <span className="text-xs text-text-dim">{attempt.attempts > 0 && `${attempt.attempts} attempt${attempt.attempts === 1 ? '' : 's'}`}</span>
        </div>
      </div>

      {lastResult && (
        <div className="space-y-3">
          {lastResult.correct ? (
            <FeedbackBanner
              kind="success"
              title={lastResult.mode === 'course' ? `Correct! +${lastResult.xpAwarded} XP` : 'Correct!'}
              detail={lastResult.mode === 'course' && lastResult.levelCompleted ? 'Level complete — nice work.' : undefined}
            />
          ) : (
            <>
              <FeedbackBanner kind="error" title="Not quite right" detail={lastResult.reason} />
              <ResultTable
                columns={lastResult.resultPreview.columns}
                rows={lastResult.resultPreview.rows}
                truncated={lastResult.resultPreview.truncated}
                emptyLabel="Your query ran, but returned no columns."
              />
            </>
          )}
        </div>
      )}

      {!lastResult?.correct && (
        <HintPanel exerciseId={exerciseId} mode={mode} hintsAvailable={exercise.hintsAvailable} hintsUsed={attempt.hintsUsed} />
      )}

      {showTheory && <TheoryOverlay topics={levelTopics} onClose={() => setShowTheory(false)} />}
    </div>
  );
}
