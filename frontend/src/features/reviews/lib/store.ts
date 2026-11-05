"use client";
import { currentUser } from "@/config/site";
import { createPersistentStore } from "@/lib/persistent-store";
import { uid } from "@/lib/format";
import { analyseReview } from "./provider";
import { canApprove } from "./metrics";
import { buildSeed } from "./seed";
import type { AuditEntry, AuditKind, FindingStatus, Review, ReviewInput, ReviewStatus } from "../types";

/**
 * Review repository. Today: browser storage (demo adapter, NOT an audit trail of record).
 * Production: replace the bodies of these functions with authenticated API calls; the UI will not change.
 */
const EMPTY: Review[] = [];
const store = createPersistentStore<Review[]>("greenlight-reviews-v2", buildSeed, EMPTY);

export const useReviews = () => store.use();
export const useReview = (id: string) => store.use().find(r => r.id === id);
export const resetReviews = () => store.reset();

const entry = (kind: AuditKind, message: string, findingId?: string): AuditEntry =>
  ({ id: uid("AU"), at: new Date().toISOString(), actor: currentUser.name, kind, message, findingId });
const clip = (s: string) => (s.length > 48 ? `${s.slice(0, 48)}…` : s);

function mutate(id: string, fn: (r: Review) => Review) {
  store.update(list => list.map(r => (r.id === id ? fn(r) : r)));
}
function touch(r: Review, patch: Partial<Review>, e?: AuditEntry): Review {
  return { ...r, ...patch, updatedAt: new Date().toISOString(), audit: e ? [...r.audit, e] : r.audit };
}
function derive(findings: Review["findings"], current: ReviewStatus): ReviewStatus {
  if (findings.some(f => f.status === "Open" || f.status === "Accepted")) return "Needs attention";
  return current === "Approved" || current === "Changes requested" ? current : "In review";
}

export async function createReview(input: ReviewInput): Promise<Review> {
  const analysis = await analyseReview(input);
  const now = new Date().toISOString();
  const review: Review = {
    id: `GL-${Date.now().toString().slice(-6)}`, title: input.title, channel: input.channel, creator: "You",
    createdAt: now, updatedAt: now, status: analysis.findings.length ? "Needs attention" : "In review",
    brandKit: input.brandKit, mode: input.mode, intent: input.intent,
    content: input.content, originalContent: input.content, source: analysis.provider, summary: analysis.summary,
    findings: analysis.findings,
    audit: [entry("submitted", "Submitted for review"), { ...entry("analysis", analysis.summary), actor: "Greenlight" }]
  };
  store.update(list => [review, ...list]);
  return review;
}

const verb: Record<FindingStatus, string> = { Open: "Reopened", Accepted: "Confirmed finding", Disputed: "Marked not applicable", Edited: "Edited wording for" };

export function decideFinding(id: string, findingId: string, status: FindingStatus) {
  mutate(id, r => {
    const f = r.findings.find(x => x.id === findingId);
    if (!f) return r;
    const findings = r.findings.map(x => (x.id === findingId ? { ...x, status } : x));
    return touch(r, { findings, status: derive(findings, r.status) }, entry("finding", `${verb[status]} “${clip(f.quote)}”`, findingId));
  });
}

/** Replaces the flagged quote in the copy (suggestion or manual wording) and records it. */
export function rewriteFinding(id: string, findingId: string, replacement: string, via: "suggestion" | "manual") {
  mutate(id, r => {
    const f = r.findings.find(x => x.id === findingId);
    if (!f || !replacement.trim() || !r.content.includes(f.quote)) return r;
    const findings = r.findings.map(x => (x.id === findingId ? { ...x, status: "Edited" as const, resolvedText: replacement } : x));
    const msg = `${via === "suggestion" ? "Applied suggested wording to" : "Replaced flagged wording in"} “${clip(f.quote)}”`;
    return touch(r, { content: r.content.replace(f.quote, replacement), findings, status: derive(findings, r.status) }, entry("edit", msg, findingId));
  });
}

export const setContent = (id: string, content: string) => mutate(id, r => {
  if (r.content === content) return r;
  return touch(r, { content }, entry("edit", "Updated submitted draft content"));
});
export const restoreContent = (id: string) =>
  mutate(id, r => touch(r, { content: r.originalContent }, entry("edit", "Restored the submitted copy")));
export function setReviewStatus(id: string, status: ReviewStatus): boolean {
  const review = store.read().find(r => r.id === id);
  if (!review) return false;
  // Enforce this in the repository too: callers cannot bypass approval safeguards.
  if (status === "Approved" && !canApprove(review)) return false;
  mutate(id, r => touch(r, { status }, entry("status", status === "Approved" ? "Approved content for publication" : `Status set to ${status.toLowerCase()}`)));
  return true;
}
