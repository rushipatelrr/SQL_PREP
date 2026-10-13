import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { RotateCcw, BookOpen, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { TheoryViewer } from '@/components/theory/TheoryViewer';
import { useLevel } from '@/hooks/useLevels';
import { useStartPractice } from '@/hooks/useProgress';

export function LevelReviewPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { data: level, isLoading } = useLevel(levelId ?? null);
  const startPracticeMutation = useStartPractice();
  const navigate = useNavigate();
  const [showTheory, setShowTheory] = useState(false);

  if (isLoading || !level) return <FullPageSpinner />;

  async function handlePracticeAgain() {
    if (!levelId) return;
    await startPracticeMutation.mutateAsync(levelId);
    navigate(`/levels/${levelId}/practice`);
  }

  if (showTheory) {
    return (
      <div>
        <button onClick={() => setShowTheory(false)} className="mb-4 flex items-center gap-1.5 text-sm text-text-dim hover:text-text">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to level
        </button>
        <TheoryViewer topics={level.topics} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <Badge tone="green">
          <CheckCircle2 className="mr-1 inline h-3 w-3" /> Completed
        </Badge>
      </div>
      <h1 className="text-xl font-semibold text-text">{level.title}</h1>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => setShowTheory(true)}>
          <BookOpen className="mr-1.5 inline h-3.5 w-3.5" /> Review Theory
        </Button>
        <Button onClick={handlePracticeAgain} disabled={startPracticeMutation.isPending}>
          <RotateCcw className="mr-1.5 inline h-3.5 w-3.5" /> Practice Again
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {level.exercises?.map((ex) => (
            <div key={ex.exerciseId} className="flex items-start gap-2.5 rounded-card border border-line px-3.5 py-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
              <div>
                <p className="text-sm font-medium text-text">{ex.concept}</p>
                <p className="mt-0.5 text-sm text-text-dim" dangerouslySetInnerHTML={{ __html: ex.prompt }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>
    </div>
  );
}
