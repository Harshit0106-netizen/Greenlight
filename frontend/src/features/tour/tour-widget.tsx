"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Compass, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ROLE_LABEL, switchDemoRole, useIsDemo, useSession } from "@/lib/session";
import { useReviews } from "@/features/reviews/lib/store";
import type { UserRole } from "@/types/contract";
import { setTourOpen, tourStore, type TourStep } from "./store";

type Step = { id: TourStep; role: UserRole; title: string; hint: string };
const STEPS: Step[] = [
  { id: "submit", role: "creator", title: "Submit a risky draft", hint: "One click loads sample copy with an unsupported claim, pressure language and a naming slip. Press Run review." },
  { id: "evidence", role: "creator", title: "Inspect a finding's evidence", hint: "Click any highlighted phrase. You get the exact quote, the approved source behind it, and why it was flagged." },
  { id: "resolve", role: "creator", title: "Resolve every finding", hint: "Apply a suggested fix, write your own, or dispute it with a reason. When none are left it goes to a reviewer." },
  { id: "approve", role: "reviewer", title: "Approve as a reviewer", hint: "Only a person can approve or send it back. The software never does. Open Approvals." },
  { id: "kit", role: "brand_admin", title: "Update the Brand Kit", hint: "Add a rule, fact or term. The very next review is checked against it." },
  { id: "insights", role: "manager", title: "See the Insights", hint: "The most common findings, and the rules people keep disputing." },
];

/** Floating checklist for demo visitors. Stays on every page, switches roles for you, ticks steps off as they happen. */
export function TourWidget() {
  const demo = useIsDemo();
  const user = useSession();
  const router = useRouter();
  const reviews = useReviews();
  const { done, open } = tourStore.use();
  const [busy, setBusy] = useState(false);
  if (!demo || !user) return null;

  const doneCount = STEPS.filter(s => done[s.id]).length;
  const current = STEPS.find(s => !done[s.id]);

  const target = (s: Step): string => {
    if (s.id === "submit") return "/reviews/new?sample=risky";
    if (s.id === "approve") return "/approvals";
    if (s.id === "kit") return "/brand-kit";
    if (s.id === "insights") return "/insights";
    const open = user.role === "creator" ? reviews.find(r => r.status === "Needs attention" && r.findings.some(f => f.status === "Open")) : undefined;
    return open ? `/reviews/${open.id}` : "/dashboard";
  };
  async function go(s: Step) {
    setBusy(true);
    try {
      if (user && user.role !== s.role) await switchDemoRole(s.role);
      router.push(target(s));
    } finally { setBusy(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setTourOpen(true)} aria-label="Open guided tour"
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-brand/30 bg-surface py-2 pl-3 pr-4 text-xs font-bold text-ink shadow-lift transition hover:border-brand print:hidden">
        <Compass size={15} className="text-brand" /> Guided tour <span className="rounded-full bg-brand/15 px-2 py-0.5 text-brand">{doneCount}/{STEPS.length}</span>
      </button>
    );
  }

  return (
    <aside aria-label="Guided tour" className="fixed bottom-4 right-4 z-30 w-[min(344px,calc(100vw-2rem))] animate-fade-in overflow-hidden rounded-2xl border border-line bg-surface shadow-lift print:hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-ink"><Compass size={16} className="text-brand" /> Guided tour</div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">{doneCount} of {STEPS.length}</span>
          <button onClick={() => setTourOpen(false)} aria-label="Minimise tour" className="rounded-lg p-1.5 text-muted transition hover:bg-soft hover:text-ink"><X size={15} /></button>
        </div>
      </div>
      <div className="h-1 bg-soft"><div className="h-full bg-brand transition-all duration-500" style={{ width: `${(doneCount / STEPS.length) * 100}%` }} /></div>

      <ol className="max-h-[60vh] space-y-0.5 overflow-y-auto p-2">
        {STEPS.map((s, i) => {
          const isDone = !!done[s.id];
          const isCurrent = current?.id === s.id;
          return (
            <li key={s.id} className={cn("rounded-xl px-3 py-2.5", isCurrent && "bg-brand/10")}>
              <div className="flex items-start gap-3">
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                  isDone ? "border-success bg-success text-brand-ink" : isCurrent ? "border-brand text-brand" : "border-line text-muted")}>
                  {isDone ? <Check size={12} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-[13px] font-semibold", isDone ? "text-muted line-through decoration-muted/40" : "text-ink")}>{s.title}</span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">{ROLE_LABEL[s.role]}</span>
                  </div>
                  {isCurrent && (
                    <>
                      <p className="mt-1 text-xs leading-5 text-muted">{s.hint}</p>
                      <button onClick={() => go(s)} disabled={busy}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-ink transition hover:bg-brand-strong disabled:opacity-60">
                        {user.role !== s.role ? `Switch to ${ROLE_LABEL[s.role]} and go` : "Take me there"} <ArrowRight size={13} />
                      </button>
                    </>
                  )}
                  {!isCurrent && !isDone && (
                    <button onClick={() => go(s)} disabled={busy} className="mt-0.5 text-[11px] font-semibold text-brand hover:text-brand-strong">Jump to this step</button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {doneCount === STEPS.length && <p className="border-t border-line px-4 py-3 text-xs leading-5 text-muted">That is the whole workflow. Use the role menu at the top to explore any view, or sign in with a registered account.</p>}
    </aside>
  );
}
