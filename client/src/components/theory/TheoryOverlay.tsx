import { TheoryViewer } from './TheoryViewer';
import type { TopicDTO } from '@/types/api';

interface TheoryOverlayProps {
  topics: TopicDTO[];
  onClose: () => void;
}

/**
 * Deliberately dumb: this component holds no progression state of its own and calls
 * nothing but onClose. Opening it never touches the exercise, the level, XP, or anything
 * else — closing it just returns to whatever the exercise page was already showing,
 * SQL editor contents included, since that state lives in the parent, not here.
 */
export function TheoryOverlay({ topics, onClose }: TheoryOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col rounded-card border border-line bg-panel p-6 shadow-2xl animate-swap-in">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-purple">
          📖 Review Theory
        </div>
        <TheoryViewer topics={topics} onClose={onClose} />
      </div>
    </div>
  );
}
