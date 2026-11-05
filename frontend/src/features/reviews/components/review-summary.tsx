import { Badge, Card, ScoreRing, StatusBadge } from "@/components/ui";
import { Sparkles } from "lucide-react";
import { approvalBlockerCount, brandSafetyScore, confirmedCount, editedCount, highOpenCount, openCount, riskLabel } from "../lib/metrics";
import type { Review } from "../types";

export function ReviewSummary({ review }: { review: Review }) {
  const score = brandSafetyScore(review.findings);
  const stats = [
    { label: "Total findings", value: review.findings.length },
    { label: "Open", value: openCount(review) },
    { label: "Confirmed · needs action", value: confirmedCount(review) },
    { label: "Edited", value: editedCount(review) },
    { label: "Approval blockers", value: approvalBlockerCount(review) },
    { label: "High severity · open", value: highOpenCount(review) }
  ];
  return (
    <Card className="mb-5 overflow-hidden">
      <div className="flex flex-col gap-6 p-5 md:flex-row md:items-center">
        <div className="flex items-center gap-5">
          <ScoreRing value={score} size={104} label="Safety" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">Brand safety</div>
            <div className="mt-1 text-xl font-bold text-ink">{riskLabel(score)}</div>
            <div className="mt-2"><StatusBadge>{review.status}</StatusBadge></div>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 md:ml-4">
          {stats.map(s => (
            <div key={s.label} className="rounded-xl bg-soft p-4">
              <div className="text-2xl font-bold tracking-tight text-ink">{s.value}</div>
              <div className="mt-1 text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-soft/60 px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Sparkles size={14} className="text-brand" />
          <span><b className="text-ink">{review.source === "api" ? "Backend analysis" : "Local demo analysis"}</b> · {review.brandKit}</span>
        </div>
        <Badge tone={review.source === "api" ? "success" : "warning"} dot>{review.source === "api" ? "API connected" : "Demo mode · rule-based"}</Badge>
      </div>
    </Card>
  );
}
