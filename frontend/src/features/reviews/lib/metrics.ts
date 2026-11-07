import type { Finding, FindingSeverity, Review } from "../types";

const weight: Record<FindingSeverity, number> = { High: 22, Medium: 10, Low: 4 };
/** Findings that still count against the content: unresolved or confirmed-but-unfixed. */
export const isLive = (f: Finding) => f.status === "Open" || f.status === "Accepted";

/** Brand safety score, 0–100. Edited and disputed findings no longer reduce it. */
export function brandSafetyScore(findings: Finding[]) {
  return Math.max(0, 100 - findings.filter(isLive).reduce((sum, f) => sum + weight[f.severity], 0));
}
export const openCount = (r: Review) => r.findings.filter(f => f.status === "Open").length;
export const confirmedCount = (r: Review) => r.findings.filter(f => f.status === "Accepted").length;
export const notApplicableCount = (r: Review) => r.findings.filter(f => f.status === "Disputed").length;
export const editedCount = (r: Review) => r.findings.filter(f => f.status === "Edited").length;
/** Findings that still block approval: open or confirmed-but-not-fixed. */
export const approvalBlockerCount = (r: Review) => r.findings.filter(isLive).length;
export const canApprove = (r: Review) => approvalBlockerCount(r) === 0;
export const highOpenCount = (r: Review) => r.findings.filter(f => f.status === "Open" && f.severity === "High").length;
export const isPending = (r: Review) => r.status !== "Approved";
export const riskLabel = (score: number) => (score >= 80 ? "Low risk" : score >= 55 ? "Moderate risk" : "High risk");
