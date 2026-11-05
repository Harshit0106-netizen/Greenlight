"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Printer, Search } from "lucide-react";
import { Button, Card, EmptyState, PageHeader, Select, Skeleton, StatCard } from "@/components/ui";
import { FileClock, Gavel, CheckCircle2 } from "lucide-react";
import { auditMeta } from "@/features/reviews/components/audit-timeline";
import { useReviews, useReviewsLoaded } from "@/features/reviews/lib/store";
import type { AuditKind } from "@/features/reviews/types";
import { cn } from "@/lib/cn";
import { formatDateTime, pad } from "@/lib/format";

/** Neutralise spreadsheet formula injection, then quote. */
const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export function HistoryView() {
  const reviews = useReviews();
  const hydrated = useReviewsLoaded();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<AuditKind | "all">("all");

  const all = useMemo(() => reviews.flatMap(r => r.audit.map(a => ({ ...a, review: r }))).sort((a, b) => +new Date(b.at) - +new Date(a.at)), [reviews]);
  const rows = all.filter(e => (kind === "all" || e.kind === kind) && `${e.message} ${e.actor} ${e.review.title} ${e.review.id}`.toLowerCase().includes(query.toLowerCase()));

  function exportCsv() {
    const lines = [["Time", "Review ID", "Review", "Actor", "Type", "Event"], ...rows.map(e => [e.at, e.review.id, e.review.title, e.actor, e.kind, e.message])];
    const url = URL.createObjectURL(new Blob([lines.map(l => l.map(cell).join(",")).join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "greenlight-audit-trail.csv" });
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader eyebrow="Governance records · Audit trail" title="Audit history" description="A chronological record of submissions, findings and the human decisions made against them."
        actions={<><Button variant="secondary" onClick={() => window.print()}><Printer size={15} /> Print</Button><Button onClick={exportCsv} disabled={!rows.length}><Download size={15} /> Export CSV</Button></>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard icon={FileClock} label="Submissions" value={hydrated ? pad(reviews.length) : "—"} />
        <StatCard icon={Gavel} tone="warning" label="Decisions recorded" value={hydrated ? pad(all.filter(e => e.kind === "finding" || e.kind === "edit").length) : "—"} />
        <StatCard icon={CheckCircle2} tone="success" label="Approved" value={hydrated ? pad(reviews.filter(r => r.status === "Approved").length) : "—"} />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search audit history…" aria-label="Search audit history"
              className="h-10 w-full rounded-xl border border-line bg-soft pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/15" />
          </div>
          <Select value={kind} onChange={e => setKind(e.target.value as AuditKind | "all")} className="h-10 sm:w-44" aria-label="Filter by event type">
            <option value="all">All events</option>
            {(Object.keys(auditMeta) as AuditKind[]).map(k => <option key={k} value={k}>{auditMeta[k].label}</option>)}
          </Select>
        </div>
        {!hydrated && <div className="p-5"><Skeleton className="h-40" /></div>}
        {hydrated && !rows.length && <EmptyState icon={Search} title="No matching events" />}
        <ol className="px-5 py-4">
          {rows.map((e, i) => {
            const { icon: Icon, tone } = auditMeta[e.kind];
            return (
              <li key={e.id} className="relative flex gap-4 pb-6 last:pb-2">
                {i < rows.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-30px)] w-px bg-line" />}
                <span className={cn("z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tone)}><Icon size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5 text-ink">{e.message}</p>
                  <p className="mt-1 text-xs text-muted">{e.actor} · {formatDateTime(e.at)} · <Link href={`/reviews/${e.review.id}`} className="font-semibold text-brand hover:underline">{e.review.id} · {e.review.title}</Link></p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
