/**
 * Fake data in the exact shape of the contract (docs/API.md). Used when NEXT_PUBLIC_USE_MOCK=true.
 * Fictional brand and people only.
 */
import type {
  AiDisclosure, ApiFinding, BrandSource, InsightGap, InsightsSummary, LoginResponse, ReviewDetail, ReviewListItem,
} from "@/types/contract";

const NOW = "2026-11-02T10:42:00Z";
const CONTENT = "We offer #1 fastest delivery, guaranteed.";

export const mockLogin: LoginResponse = {
  access_token: "mock-token", token_type: "bearer",
  user: { id: "U-1", name: "Harshit Verma", role: "manager", workspace_id: "W-1" },
};

export const mockSources: BrandSource[] = [
  { id: "G-4.2", kind: "guideline", title: "Avoid unsupported superlatives", text: "Do not use claims such as '#1', 'best' or 'fastest' unless an approved fact substantiates them.", version: "v3", status: "active" },
  { id: "F-12", kind: "fact", title: "Delivery coverage", text: "Fast delivery is available in select cities.", version: "v3", status: "active" },
  { id: "T-8", kind: "term", title: "Zippy bottle", text: "Use: Zippy Bottle. Approved product name and capitalisation.", version: "v3", status: "active" },
];

export const mockReviews: ReviewListItem[] = [
  { id: "CL-2084", title: "Summer launch announcement", creator: "Aarav Mehta", status: "in_review", finding_count: 1, updated_at: NOW },
];

export const mockReviewDetail: ReviewDetail = {
  id: "CL-2084", title: "Summer launch announcement", content: CONTENT, status: "in_review",
  creator: "Aarav Mehta", brand_kit_version: "v3", updated_at: NOW,
};

export const mockFindings: ApiFinding[] = [{
  finding_id: "FD-1042", type: "unsupported_claim", severity: "high",
  span: { start: 9, end: 40, text: "#1 fastest delivery, guaranteed" },
  source: { kind: "guideline", id: "G-4.2", version: "v3" }, fact_match: null,
  reason: "No approved fact substantiates this wording. It is unsupported, not proven false.",
  confidence: 0.91, method: "rule_based",
  suggestion: { text: "Fast delivery is available in select cities.", fact_id: "F-12", applied: false }, decision: null,
}];

export const mockSummary: InsightsSummary = {
  reviewed_this_month: 128, needs_attention: 8, awaiting_approval: 12, approved_this_month: 94,
  top_issues: [{ type: "unsupported_claim", count: 31 }],
};
export const mockGaps: InsightGap[] = [
  { source_id: "G-4.2", title: "Avoid unsupported superlatives", dispute_count: 9, note: "Often disputed; may be unclear." },
];
export const mockDisclosure: AiDisclosure = {
  review_id: "CL-2084",
  steps: [{ step: "judge", used_ai: true, model: "claude", data_sent: "1 sentence + 2 matched sources" }, { step: "rules", used_ai: false }],
};

/** Routes a request the way the live API would, from fixed fake data. */
export function mockRequest<T>(path: string, init: RequestInit = {}): T {
  const method = (init.method ?? "GET").toUpperCase();
  const body = init.body ? JSON.parse(String(init.body)) : {};
  const route = path.split("?")[0];
  let out: unknown;
  if (route === "/auth/login") out = mockLogin;
  else if (route === "/brand-kit/sources") {
    const kind = new URLSearchParams(path.split("?")[1] ?? "").get("kind");
    out = method === "POST"
      ? { id: "F-12", version: "v3", status: "active", ...body }
      : mockSources.filter(s => !kind || s.kind === kind);
  }
  else if (route === "/reviews") out = method === "POST" ? { id: "CL-2084", status: "scanned", finding_count: 1 } : mockReviews;
  else if (/^\/reviews\/[^/]+$/.test(route)) out = mockReviewDetail;
  else if (/\/findings$/.test(route)) out = mockFindings;
  else if (/^\/findings\//.test(route)) out = { finding_id: "FD-1042", decision: { action: body.action, reason: body.reason, actor: "U-1" } };
  else if (/\/comments$/.test(route)) out = { id: "C-77", author: "Harshit Verma", text: body.text, created_at: NOW };
  else if (/\/approve$/.test(route)) out = { id: "CL-2084", status: "approved" };
  else if (/\/request-changes$/.test(route)) out = { id: "CL-2084", status: "changes_requested" };
  else if (route === "/insights/summary") out = mockSummary;
  else if (route === "/insights/gaps") out = mockGaps;
  else if (/\/ai-disclosure$/.test(route)) out = mockDisclosure;
  else throw new Error(`No mock for ${method} ${route}`);
  return out as T;
}
