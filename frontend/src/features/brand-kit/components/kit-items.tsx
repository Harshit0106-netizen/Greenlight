import { BookOpen, ChevronRight, Palette, UploadCloud } from "lucide-react";
import { Badge, Button, StatusBadge, useToast } from "@/components/ui";
import { brandPalette } from "../data";
import type { ApprovedFact, BrandRule, BrandTerm } from "../types";

export function RuleCard({ rule }: { rule: BrandRule }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line p-4 transition hover:border-brand/30 hover:bg-brand/[.03] sm:flex-row sm:items-start">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><BookOpen size={16} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-ink">{rule.title}</span><StatusBadge>{rule.status}</StatusBadge></div>
        <p className="mt-1.5 text-sm leading-6 text-muted">{rule.description}</p>
        <div className="mt-2 text-xs text-muted/80">{rule.source} · {rule.id}</div>
      </div>
      <div className="flex items-center gap-1 self-start"><Badge>{rule.category}</Badge></div>
    </div>
  );
}

export function FactCard({ fact }: { fact: ApprovedFact }) {
  return (
    <div className="rounded-xl border border-line p-4 transition hover:border-success/40">
      <div className="flex items-start justify-between gap-2"><div className="text-sm font-semibold text-ink">{fact.subject}</div><StatusBadge>Approved</StatusBadge></div>
      <p className="mt-3 text-sm leading-6 text-ink/80">{fact.approvedText}</p>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted"><span>{fact.source} · {fact.id}</span></div>
    </div>
  );
}

export function TermRow({ term }: { term: BrandTerm }) {
  return (
    <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-3 rounded-xl border border-line p-3">
      <div><div className="text-sm font-semibold text-danger line-through decoration-danger/40">{term.avoid}</div><div className="mt-1 text-xs text-muted">{term.note}</div></div>
      <ChevronRight size={16} className="text-muted" />
      <div className="flex items-center justify-between gap-2"><div className="text-sm font-bold text-success">{term.use}</div></div>
    </div>
  );
}

export function VisualAssets() {
  const { toast } = useToast();
  return (
    <div className="grid gap-4 px-5 pb-5 md:grid-cols-2">
      <div className="rounded-xl border border-line p-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><Palette size={15} className="text-brand" /> Approved colour palette</div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {brandPalette.map(c => (
            <div key={c.name}><div className="h-14 rounded-lg border border-line" style={{ background: c.hex }} /><div className="mt-1.5 text-xs font-semibold text-ink">{c.name}</div><div className="text-[11px] text-muted">{c.hex}</div></div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-line bg-soft/60 p-6 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-muted shadow-card"><UploadCloud size={19} /></span>
        <div className="mt-3 text-sm font-semibold">Logo and campaign assets</div>
        <p className="mt-1 text-xs leading-5 text-muted">Asset storage and image inspection connect through the backend.</p>
        <Button size="sm" variant="secondary" className="mt-3" onClick={() => toast("Asset uploads unlock when backend file storage is connected.", "info")}>Upload asset</Button>
      </div>
    </div>
  );
}
