"use client";
import { useMemo, useState } from "react";
import { FileText, Pencil, RotateCcw } from "lucide-react";
import { Button, Card, CardHeader, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { buildSegments } from "../lib/segments";
import type { Finding, Review } from "../types";

const tone = {
  High: "bg-danger/10 decoration-danger",
  Medium: "bg-warning/10 decoration-warning",
  Low: "bg-info/10 decoration-info"
} as const;

function markClass(f: Finding, selected: boolean) {
  return cn(
    "cursor-pointer rounded px-0.5 py-0.5 underline decoration-wavy decoration-[1.5px] underline-offset-[5px] transition [box-decoration-break:clone]",
    f.status === "Edited" ? "bg-success/10 decoration-success no-underline" :
    f.status === "Disputed" ? "bg-transparent decoration-muted/50 decoration-dotted opacity-70" : tone[f.severity],
    selected && "ring-2 ring-brand ring-offset-2 ring-offset-surface"
  );
}

type Props = { review: Review; selectedId: string; onSelect: (id: string) => void; onChange: (text: string) => void; onRestore: () => void };

export function AnnotatedContent({ review, selectedId, onSelect, onChange, onRestore }: Props) {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(review.content);
  const unchanged = draftText === review.content;
  const segments = useMemo(() => buildSegments(review.content, review.findings), [review.content, review.findings]);
  const unmatched = review.findings.filter(f => !segments.some(s => s.finding?.id === f.id) && f.status !== "Edited").length;
  const indexOf = (id: string) => review.findings.findIndex(f => f.id === id) + 1;

  return (
    <Card className="overflow-hidden">
      <CardHeader icon={FileText} title="Submitted content" description={editing ? "Make your corrections here, then explicitly save them to the review." : "Click any highlight to inspect its evidence."}
        action={editing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => { setDraftText(review.content); setEditing(false); }}>Cancel</Button>
            <Button size="sm" onClick={() => { onChange(draftText); setEditing(false); }} disabled={unchanged}>Save draft changes</Button>
          </div>
        ) : (
          <button onClick={() => { setDraftText(review.content); setEditing(true); }} className="flex items-center gap-1.5 rounded-lg border border-line bg-soft px-3 py-2 text-xs font-semibold text-muted transition hover:text-ink">
            <Pencil size={13} /> Edit draft
          </button>
        )} />
      <div className="p-5">
        {editing ? (
          <Textarea value={draftText} onChange={e => setDraftText(e.target.value)} rows={14} className="resize-y bg-soft/60 text-[15px] leading-8" aria-label="Edit submitted content" />
        ) : (
          <div className="min-h-[260px] whitespace-pre-wrap rounded-xl bg-soft/60 p-5 text-[15px] leading-8 text-ink">
            {segments.map((s, i) => s.finding ? (
              <mark key={i} role="button" tabIndex={0} onClick={() => onSelect(s.finding!.id)}
                onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(s.finding!.id))}
                className={markClass(s.finding, s.finding.id === selectedId)} title={`${s.finding.category} · ${s.finding.severity}`}>
                {s.text}<sup className="ml-0.5 text-[10px] font-bold text-brand">{indexOf(s.finding.id)}</sup>
              </mark>
            ) : <span key={i}>{s.text}</span>)}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted">
            {[["bg-danger", "High"], ["bg-warning", "Medium"], ["bg-info", "Low"], ["bg-success", "Fixed"]].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5"><i className={cn("h-2 w-2 rounded-full", c)} />{l}</span>
            ))}
            {unmatched > 0 && <span className="text-warning">{unmatched} finding{unmatched > 1 ? "s" : ""} no longer match the copy</span>}
          </div>
          {!editing && <Button size="sm" variant="secondary" onClick={onRestore} disabled={review.content === review.originalContent}><RotateCcw size={13} /> Restore submitted copy</Button>}
        </div>
      </div>
    </Card>
  );
}
