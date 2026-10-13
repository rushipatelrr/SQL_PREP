import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TopicContent, TopicTeaser } from './TopicContent';
import type { TopicDTO } from '@/types/api';

interface TheoryViewerProps {
  topics: TopicDTO[];
  /** Shown instead of "Next topic" on the last topic. */
  onFinish?: () => void;
  finishLabel?: string;
  onClose?: () => void;
}

export function TheoryViewer({ topics, onFinish, finishLabel = 'Start exercises', onClose }: TheoryViewerProps) {
  const [index, setIndex] = useState(0);
  const topic = topics[index];
  const isLast = index === topics.length - 1;

  if (!topic) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {topics.map((t, i) => (
            <button
              key={t.title}
              onClick={() => setIndex(i)}
              className={`h-1.5 w-6 rounded-full transition-colors ${i === index ? 'bg-amber' : i < index ? 'bg-green' : 'bg-line'}`}
              aria-label={`Go to topic ${i + 1}: ${t.title}`}
            />
          ))}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-dim transition-colors hover:text-text" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <TopicContent topic={topic} />
        {isLast && !onClose && <div className="mt-6">{<TopicTeaser />}</div>}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <Button variant="ghost" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
          <ChevronLeft className="mr-1 inline h-4 w-4" />
          Back
        </Button>
        <span className="text-xs text-text-dim">
          {index + 1} / {topics.length}
        </span>
        {isLast ? (
          onFinish ? (
            <Button onClick={onFinish}>{finishLabel}</Button>
          ) : (
            <span className="w-[88px]" />
          )
        ) : (
          <Button variant="ghost" onClick={() => setIndex((i) => i + 1)}>
            Next
            <ChevronRight className="ml-1 inline h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
