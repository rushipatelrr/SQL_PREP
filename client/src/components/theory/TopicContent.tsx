import { Lightbulb, AlertTriangle, ListChecks } from 'lucide-react';
import type { TopicDTO } from '@/types/api';

function Section({ label, html, mono }: { label: string; html?: string; mono?: boolean }) {
  if (!html) return null;
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-cyan">{label}</p>
      <div
        className={mono ? 'whitespace-pre-wrap rounded-card border border-line bg-panel2 p-3 font-mono text-[13px] text-text' : 'text-[14px] leading-relaxed text-text'}
        // Topic content is authored by us (curriculum.ts), never user input — safe to render.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export function TopicContent({ topic }: { topic: TopicDTO }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-text">{topic.title}</h3>
      <Section label="What is it?" html={topic.what} />
      <Section label="Why it's useful" html={topic.why} />
      <Section label="Syntax" html={topic.syntax} mono />
      {topic.example && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Section label="Example" html={topic.example} mono />
          <Section label="What it does" html={topic.exampleExplain} />
        </div>
      )}
      {topic.example2 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Section label="Another example" html={topic.example2} mono />
          <Section label="What it does" html={topic.example2Explain} />
        </div>
      )}
      <Section label="When to use it" html={topic.whenToUse} />

      {topic.mistake && (
        <div className="flex items-start gap-2.5 rounded-card border border-red/30 bg-red/10 px-3.5 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red">Common mistake</p>
            <p className="mt-1 text-[14px] text-text" dangerouslySetInnerHTML={{ __html: topic.mistake }} />
          </div>
        </div>
      )}

      {topic.remember && topic.remember.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-card border border-green/30 bg-green/10 px-3.5 py-3">
          <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-green" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-green">Remember</p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-[14px] text-text">
              {topic.remember.map((point, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: point }} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopicTeaser() {
  return (
    <div className="flex items-center gap-2 text-sm text-text-dim">
      <Lightbulb className="h-4 w-4" />
      Now let&apos;s use this concept in exercises.
    </div>
  );
}
