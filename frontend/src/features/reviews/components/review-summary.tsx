import { ScoreRing, StatusBadge } from "@/components/ui";
import { approvalBlockerCount, brandSafetyScore, openCount, riskLabel } from "../lib/metrics";
import type { Review } from "../types";

/** Safety ring, one line of state, one progress bar. */
export function ReviewSummary({ review }: { review: Review }) {
  const total = review.findings.length;
  const blockers = approvalBlockerCount(review);
  const score = brandSafetyScore(review.findings);
  const pct = total ? Math.round(((total - blockers) / total) * 100) : 100;
  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-5">
        <ScoreRing value={score} size={76} stroke={8} label="Safety" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge>{review.status}</StatusBadge>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">{riskLabel(score)}</span>
          </div>
          <div className="mt-1.5 text-lg font-bold text-ink">
            {total === 0 ? "No issues found" : blockers === 0 ? "All findings resolved" : `${blockers} of ${total} finding${total === 1 ? "" : "s"} left to resolve`}
          </div>
          <div className="mt-1 text-xs text-muted">{openCount(review)} untouched · {review.brandKit}</div>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Findings resolved">
        <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
