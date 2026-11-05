"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, Info, Printer, SearchX } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, PageHeader, Skeleton, useToast, buttonClass } from "@/components/ui";
import { useHydrated } from "@/lib/hooks";
import { relativeTime } from "@/lib/format";
import { decideFinding, restoreContent, rewriteFinding, setContent, setReviewStatus, useReview } from "../lib/store";
import type { FindingStatus } from "../types";
import { AnnotatedContent } from "./annotated-content";
import { AuditTimeline } from "./audit-timeline";
import { FindingEvidence } from "./finding-evidence";
import { FindingList } from "./finding-list";
import { ReviewOutcome } from "./review-outcome";
import { ReviewSummary } from "./review-summary";

const toastFor: Record<FindingStatus, string> = {
  Accepted: "Finding confirmed as a valid issue. Correct the draft before approval.", Disputed: "Finding marked not applicable.", Edited: "Replacement saved to the draft. Review the updated copy.", Open: "Finding reopened."
};

export function ReviewWorkspace({ id }: { id: string }) {
  const review = useReview(id);
  const hydrated = useHydrated();
  const { toast } = useToast();
  const [selected, setSelected] = useState("");
  const findings = review?.findings ?? [];
  const current = findings.find(f => f.id === selected) ?? findings[0];

  // J / K walk through findings without leaving the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || e.metaKey || e.ctrlKey || !findings.length) return;
      const i = findings.findIndex(f => f.id === current?.id);
      if (e.key === "j") setSelected(findings[Math.min(i + 1, findings.length - 1)].id);
      if (e.key === "k") setSelected(findings[Math.max(i - 1, 0)].id);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [findings, current?.id]);

  if (!hydrated) return <div className="space-y-5"><Skeleton className="h-10 w-72" /><Skeleton className="h-40" /><Skeleton className="h-96" /></div>;
  if (!review) {
    return (
      <Card><EmptyState icon={SearchX} title="Review not found" description="It may have been cleared from this browser, or the link is incorrect."
        action={<Link href="/reviews" className={buttonClass("primary", "md")}>Back to reviews</Link>} /></Card>
    );
  }

  const advance = () => {
    const next = findings.find(f => f.id !== current?.id && f.status === "Open");
    if (next) setSelected(next.id);
  };
  const decide = (status: FindingStatus) => {
    if (!current) return;
    decideFinding(id, current.id, status);
    toast(toastFor[status]);
    if (status === "Accepted" || status === "Disputed") advance();
  };
  const canApply = !!current && review.content.includes(current.quote);
  const rewrite = (text: string, via: "suggestion" | "manual") => {
    if (!current) return;
    rewriteFinding(id, current.id, text, via);
    toast(via === "suggestion" ? "Suggested replacement applied to the draft." : "Replacement saved to the draft.");
    advance();
  };

  return (
    <div>
      <Link href="/reviews" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-brand"><ArrowLeft size={14} /> All reviews</Link>
      <PageHeader eyebrow={`Review ${review.id} · ${review.channel}`} title={review.title}
        description={`Submitted by ${review.creator} · updated ${relativeTime(review.updatedAt)}`}
        actions={<Button variant="secondary" onClick={() => window.print()}><Printer size={15} /> Print report</Button>} />

      <ReviewSummary review={review} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <AnnotatedContent review={review} selectedId={current?.id ?? ""} onSelect={setSelected}
            onChange={text => setContent(id, text)} onRestore={() => { restoreContent(id); toast("Draft restored to the submitted version.", "info"); }} />
          <FindingList findings={findings} selectedId={current?.id ?? ""} onSelect={setSelected} />
        </div>
        <div className="space-y-5">
          <FindingEvidence finding={current} source={review.source} canApply={canApply}
            onDecide={decide} onApply={() => current && rewrite(current.suggestion, "suggestion")} onRewrite={t => rewrite(t, "manual")} />
          <ReviewOutcome review={review}
            onApprove={() => { const approved = setReviewStatus(id, "Approved"); toast(approved ? "Review approved. All findings have been dispositioned." : "Approval blocked: resolve or dispute all confirmed findings first.", approved ? "success" : "warning"); }}
            onRequestChanges={() => { setReviewStatus(id, "Changes requested"); toast("Changes requested.", "info"); }} />
          <Card><CardHeader icon={History} title="Audit trail" description="Who decided what, and when" /><AuditTimeline entries={review.audit} /></Card>
          <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning/10 p-4 text-xs leading-5 text-ink/80">
            <Info size={15} className="mt-0.5 shrink-0 text-warning" />
            {review.source === "api"
              ? "Backend analysis returned these findings. Verify that the API includes source IDs, excerpts and policy versions before production use."
              : "Demo mode: checks are deterministic local rules, not an AI model. They demonstrate the review workflow while the backend is being built."}
          </div>
        </div>
      </div>
    </div>
  );
}
