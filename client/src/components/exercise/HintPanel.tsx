import { useState } from 'react';
import { Lightbulb, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useRequestHint, useRevealSolution } from '@/hooks/useExercise';
import type { AttemptMode } from '@/types/api';

interface HintPanelProps {
  exerciseId: string;
  mode: AttemptMode;
  hintsAvailable: number;
  hintsUsed: number;
}

export function HintPanel({ exerciseId, mode, hintsAvailable, hintsUsed }: HintPanelProps) {
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [solution, setSolution] = useState<{ sql: string; explanation: string } | null>(null);
  const hintMutation = useRequestHint(exerciseId, mode);
  const solutionMutation = useRevealSolution(exerciseId, mode);

  const nextHintNumber = hintsUsed + revealedHints.length + 1;
  const canRequestMore = nextHintNumber <= hintsAvailable && !solution;

  async function handleRequestHint() {
    const result = await hintMutation.mutateAsync();
    setRevealedHints((prev) => [...prev, result.hintText]);
  }

  async function handleRevealSolution() {
    const result = await solutionMutation.mutateAsync();
    setSolution(result);
  }

  if (hintsAvailable === 0 && !solution) return null;

  return (
    <div className="space-y-2">
      {revealedHints.map((hint, i) => (
        <div key={i} className="rounded-card border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-text">
          <span className="mr-1.5 font-semibold text-amber">Hint {i + 1}:</span>
          {hint}
        </div>
      ))}

      {solution && (
        <div className="space-y-1.5 rounded-card border border-purple/30 bg-purple/10 px-3 py-2.5 text-sm">
          <p className="font-semibold text-purple">Solution</p>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[13px] text-text">{solution.sql}</pre>
          <p className="text-text-dim">{solution.explanation}</p>
        </div>
      )}

      {!solution && (
        <div className="flex gap-2">
          {canRequestMore && (
            <Button variant="ghost" onClick={handleRequestHint} disabled={hintMutation.isPending}>
              {hintMutation.isPending ? <Spinner /> : <Lightbulb className="mr-1.5 inline h-3.5 w-3.5" />}
              Hint ({nextHintNumber}/{hintsAvailable})
            </Button>
          )}
          <Button variant="ghost" onClick={handleRevealSolution} disabled={solutionMutation.isPending}>
            {solutionMutation.isPending ? <Spinner /> : <Eye className="mr-1.5 inline h-3.5 w-3.5" />}
            Show solution
          </Button>
        </div>
      )}
    </div>
  );
}
