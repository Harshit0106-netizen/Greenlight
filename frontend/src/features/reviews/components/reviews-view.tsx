"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FileCheck2, Plus, Search } from "lucide-react";
import { Avatar, Card, EmptyState, PageHeader, ScoreRing, Select, Skeleton, StatusBadge, buttonClass } from "@/components/ui";
import { pad, relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { brandSafetyScore } from "../lib/metrics";
import { useReviews, useReviewsLoaded } from "../lib/store";
import type { ReviewStatus } from "../types";

type Filter = "All reviews" | ReviewStatus;
const filters: Filter[] = ["All reviews", "Needs attention", "In review", "Changes requested", "Approved"];
const cols = "md:grid-cols-[minmax(240px,1.8fr)_1fr_1fr_150px_90px]";

export function ReviewsView() {
  const reviews = useReviews();
  const hydrated = useReviewsLoaded();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Filter>("All reviews");
  const [sort, setSort] = useState<"recent" | "risk">("recent");

  const counts = useMemo(() => filters.map(f => ({ label: f, value: f === "All reviews" ? reviews.length : reviews.filter(r => r.status === f).length })), [reviews]);
  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return reviews
      .filter(r => (status === "All reviews" || r.status === status) && `${r.title} ${r.id} ${r.creator} ${r.channel}`.toLowerCase().includes(q))
      .sort((a, b) => sort === "recent" ? +new Date(b.updatedAt) - +new Date(a.updatedAt) : brandSafetyScore(a.findings) - brandSafetyScore(b.findings));
  }, [reviews, query, status, sort]);

  return (
    <div>
      <PageHeader eyebrow="Content governance" title="Content reviews" description="Every submission, finding and human decision in one workspace."
        actions={<Link href="/reviews/new" className={buttonClass("primary", "lg")}><Plus size={16} /> New review</Link>} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {counts.map(c => (
          <button key={c.label} onClick={() => setStatus(c.label)} aria-pressed={status === c.label}
            className={cn("rounded-2xl border p-4 text-left transition", status === c.label ? "border-brand/40 bg-brand/5 shadow-card" : "border-line bg-surface hover:border-brand/30")}>
            <div className="text-xs font-semibold text-muted">{c.label}</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-ink">{pad(c.value)}</div>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title, ID, creator or channel…" aria-label="Search reviews"
              className="h-10 w-full rounded-xl border border-line bg-soft pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/15" />
          </div>
          <Select value={sort} onChange={e => setSort(e.target.value as "recent" | "risk")} aria-label="Sort reviews" className="h-10 w-full md:w-48">
            <option value="recent">Most recently updated</option><option value="risk">Highest risk first</option>
          </Select>
        </div>

        <div className={cn("hidden gap-3 bg-soft px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted md:grid", cols)}>
          <span>Submission</span><span>Created by</span><span>Last updated</span><span>Status</span><span className="text-right">Safety</span>
        </div>

        {!hydrated && <div className="space-y-3 p-5"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>}
        {hydrated && rows.map(r => (
          <Link key={r.id} href={`/reviews/${r.id}`} className={cn("group grid gap-3 border-t border-line px-5 py-4 transition hover:bg-soft md:items-center", cols)}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><FileCheck2 size={17} /></span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink group-hover:text-brand">{r.title}</div>
                <div className="mt-0.5 text-xs text-muted">{r.id} · {r.channel} · {r.findings.length} finding{r.findings.length === 1 ? "" : "s"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink/80"><Avatar name={r.creator} size={26} />{r.creator}</div>
            <div className="text-sm text-muted">{relativeTime(r.updatedAt)}</div>
            <div><StatusBadge>{r.status}</StatusBadge></div>
            <div className="flex items-center justify-between md:justify-end md:gap-2">
              <ScoreRing value={brandSafetyScore(r.findings)} size={40} stroke={5} label="Safety" />
              <ArrowUpRight size={14} className="text-muted transition group-hover:text-brand" />
            </div>
          </Link>
        ))}
        {hydrated && !rows.length && <EmptyState icon={Search} title="No reviews found" description="Try another search or filter, or create a new submission."
          action={<Link href="/reviews/new" className={buttonClass("primary", "md")}>New review</Link>} />}
        <div className="border-t border-line bg-soft/60 px-5 py-3 text-xs text-muted">Showing {rows.length} of {reviews.length} reviews</div>
      </Card>
    </div>
  );
}
