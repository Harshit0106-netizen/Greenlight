"use client";
import Link from "next/link";
import { ArrowUpRight, CalendarClock, CheckCheck, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { Avatar, Button, Card, CardHeader, EmptyState, PageHeader, ScoreRing, Skeleton, StatCard, StatusBadge, useToast } from "@/components/ui";
import { brandSafetyScore, isPending, openCount } from "@/features/reviews/lib/metrics";
import { setReviewStatus, useReviews } from "@/features/reviews/lib/store";
import { useHydrated } from "@/lib/hooks";
import { pad, relativeTime } from "@/lib/format";

const cols = "md:grid-cols-[1.7fr_1fr_1fr_80px_130px]";

export function ApprovalsView() {
  const reviews = useReviews();
  const hydrated = useHydrated();
  const { toast } = useToast();
  const pending = reviews.filter(isPending);
  const ready = pending.filter(r => openCount(r) === 0 && r.status === "In review");
  const approved = reviews.filter(r => r.status === "Approved").length;

  return (
    <div>
      <PageHeader eyebrow="Team workflow · Decisions" title="Approval queue" description="Review completed checks, resolve outstanding issues and make the final human decision." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock3} tone="warning" label="Awaiting decision" value={hydrated ? pad(pending.length) : "—"} hint="Items in the approval queue" />
        <StatCard icon={CheckCheck} tone="success" label="Ready to approve" value={hydrated ? pad(ready.length) : "—"} hint="All findings dispositioned" />
        <StatCard icon={CheckCircle2} tone="info" label="Approved" value={hydrated ? pad(approved) : "—"} hint="In this workspace" />
        <StatCard icon={CalendarClock} label="Avg. decision time" value="4.2 hrs" hint="Last 30 days · sample" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader icon={ShieldCheck} title="Needs your attention" description="Content awaiting a reviewer or manager decision" />
        <div className={`hidden gap-3 bg-soft px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted md:grid ${cols}`}><span>Submission</span><span>Submitted by</span><span>Status</span><span>Safety</span><span className="text-right">Action</span></div>
        {!hydrated && <div className="space-y-3 p-5"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>}
        {hydrated && !pending.length && <EmptyState icon={CheckCircle2} title="Queue is clear" description="Everything has a final decision." />}
        {pending.map(r => {
          const isReady = openCount(r) === 0 && r.status === "In review";
          return (
            <div key={r.id} className={`grid gap-3 border-t border-line px-5 py-4 md:items-center ${cols}`}>
              <Link href={`/reviews/${r.id}`} className="group min-w-0">
                <div className="truncate text-sm font-semibold text-ink group-hover:text-brand">{r.title}</div>
                <div className="mt-0.5 text-xs text-muted">{r.id} · {r.channel} · {openCount(r)} open · {relativeTime(r.updatedAt)}</div>
              </Link>
              <div className="flex items-center gap-2 text-sm text-ink/80"><Avatar name={r.creator} size={26} />{r.creator}</div>
              <div><StatusBadge>{r.status}</StatusBadge></div>
              <ScoreRing value={brandSafetyScore(r.findings)} size={40} stroke={5} label="Safety" />
              <div className="md:text-right">
                {isReady
                  ? <Button size="sm" onClick={() => { setReviewStatus(r.id, "Approved"); toast(`“${r.title}” approved.`); }}><CheckCheck size={13} /> Approve</Button>
                  : <Link href={`/reviews/${r.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-strong">Review <ArrowUpRight size={13} /></Link>}
              </div>
            </div>
          );
        })}
      </Card>
      <p className="mt-3 text-center text-xs text-muted">Human approval is the final step. Automated checks cannot approve or reject content.</p>
    </div>
  );
}
