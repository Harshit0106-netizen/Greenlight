"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3, FileCheck2, Plus, ShieldAlert, Sparkles, Users } from "lucide-react";
import { Avatar, Badge, Card, CardHeader, EmptyState, ScoreRing, Skeleton, StatCard, StatusBadge, buttonClass } from "@/components/ui";
import { api } from "@/lib/api";
import { can, useSession } from "@/lib/session";
import { useAsync } from "@/lib/use-api";
import { highOpenCount, brandSafetyScore, isPending } from "@/features/reviews/lib/metrics";
import { useReviews, useReviewsLoaded } from "@/features/reviews/lib/store";
import { pad, relativeTime } from "@/lib/format";
import { sampleKpis } from "../data";
import { ActivityChart } from "./activity-chart";
import { DashboardHero } from "./dashboard-hero";

export function DashboardView() {
  const reviews = useReviews();
  const hydrated = useReviewsLoaded();
  const user = useSession();
  const summary = useAsync(() => api.getInsightsSummary()).data;

  const attention = reviews.filter(r => r.status === "Needs attention");
  const pending = reviews.filter(isPending);
  const queue = [...pending].sort((a, b) => brandSafetyScore(a.findings) - brandSafetyScore(b.findings)).slice(0, 4);
  const high = reviews.reduce((n, r) => n + highOpenCount(r), 0);
  const activity = reviews
    .flatMap(r => r.audit.filter(a => a.kind !== "analysis").map(a => ({ ...a, review: r })))
    .sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 5);

  return (
    <div className="space-y-6">
      <DashboardHero firstName={(user?.name ?? "there").split(" ")[0]} />

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard icon={FileCheck2} label="Reviews completed" value={summary ? pad(summary.reviewed_this_month) : "—"} hint="Submitted this month · live" />
        <StatCard icon={ShieldAlert} tone="danger" label="Needs attention" value={hydrated ? pad(attention.length) : "—"} trend={`${high} high priority`} trendTone="danger" hint="Live from your workspace" />
        <StatCard icon={Clock3} tone="warning" label="Awaiting approval" value={hydrated ? pad(pending.length) : "—"} trend="Live" trendTone="warning" hint="Reviews without a final decision" />
        <StatCard icon={CheckCircle2} tone="success" label="Approved content" value={summary ? pad(summary.approved_this_month) : "—"} hint="Approved this month · live" />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1.55fr_1fr]">
        <ActivityChart />
        <Card className="overflow-hidden">
          <CardHeader title="Brand health" description="Workspace consistency index · sample" action={<Badge tone="success" dot>Good standing</Badge>} />
          <div className="flex flex-col items-center px-5 py-6">
            <ScoreRing value={sampleKpis.brandScore} size={168} stroke={13} label="Brand score" />
            <div className="mt-5 flex w-full items-center justify-between border-t border-line pt-4 text-xs"><span className="text-muted">Compared to last month</span><span className="font-bold text-success">+4 points ↑</span></div>
            <Link href="/insights" className={buttonClass("secondary", "md", "mt-4 w-full")}>Explore brand insights <ArrowRight size={14} /></Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader icon={ShieldAlert} title="Needs your attention" description="Riskiest content first" action={<Link href="/reviews" className="text-xs font-bold text-brand hover:text-brand-strong">View all <ArrowUpRight size={12} className="inline" /></Link>} />
          {!hydrated && <div className="space-y-3 p-5"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>}
          {hydrated && !queue.length && <EmptyState icon={CheckCircle2} title="You’re all caught up" description="Every review has a final decision." action={can.submit(user?.role) ? <Link href="/reviews/new" className={buttonClass("primary", "md")}><Plus size={14} /> Start a review</Link> : undefined} />}
          <div className="divide-y divide-line">
            {queue.map(r => (
              <Link key={r.id} href={`/reviews/${r.id}`} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-soft">
                <ScoreRing value={brandSafetyScore(r.findings)} size={46} stroke={5} label="Safety" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink group-hover:text-brand">{r.title}</div>
                  <div className="mt-0.5 text-xs text-muted">{r.id} · {r.channel} · {r.creator}</div>
                </div>
                <div className="hidden sm:block"><StatusBadge>{r.status}</StatusBadge></div>
                <ArrowUpRight size={15} className="text-muted transition group-hover:text-brand" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader icon={Users} title="Team activity" description="Live from the audit trail" />
          <ul className="space-y-5 p-5">
            {!hydrated && <Skeleton className="h-24" />}
            {activity.map(a => (
              <li key={a.id} className="flex gap-3">
                <Avatar name={a.actor} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5 text-ink/80"><b className="text-ink">{a.actor}</b> · {a.message} <Link href={`/reviews/${a.review.id}`} className="font-semibold text-brand hover:underline">{a.review.title}</Link></p>
                  <div className="mt-1 text-xs text-muted">{relativeTime(a.at)}</div>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/history" className="mx-5 mb-5 flex items-center justify-between rounded-xl border border-line px-4 py-3 text-xs font-bold text-ink/80 transition hover:border-brand/40 hover:text-brand">Open audit history <ArrowRight size={14} /></Link>
        </Card>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/10 via-surface to-surface p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand shadow-card"><Sparkles size={20} /></span>
        <div className="flex-1">
          <div className="text-sm font-bold text-ink">Your Brand Kit is the source of truth</div>
          <p className="mt-1 text-xs leading-5 text-muted">Add a term or rule and the next review enforces it immediately. Every reliable finding starts with a trusted source.</p>
        </div>
        <Link href="/brand-kit" className={buttonClass("secondary", "md")}>Manage Brand Kit <ArrowUpRight size={14} /></Link>
      </div>
    </div>
  );
}
