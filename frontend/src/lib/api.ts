import type {
  AiDisclosure, ApiFinding, BrandSource, CommentResponse, CreateBrandSourceRequest,
  CreateCommentRequest, CreateReviewRequest, CreateReviewResponse, FindingAction,
  InsightGap, InsightsSummary, LoginRequest, LoginResponse, PatchFindingRequest,
  PatchFindingResponse, ReviewDetail, ReviewListItem, SourceKind, WorkflowNoteRequest,
  WorkflowResponse,
} from "@/types/contract";
import { mockRequest } from "./mockData";

const DEFAULT_TIMEOUT_MS = 12_000;
const TOKEN_KEY = "greenlight-access-token";

/** NEXT_PUBLIC_USE_MOCK=true (default) serves contract-shaped fake data; false talks to the live backend. */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export class ApiError extends Error {
  /** Contract error code, e.g. "forbidden". */
  get code(): string | undefined { return (this.body as { error?: { code?: string } } | undefined)?.error?.code; }
  constructor(message: string, public readonly status: number, public readonly body?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

function apiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!value) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  return value.replace(/\/$/, "");
}

/** Store only the short-lived access token; never store passwords or secrets. */
export function saveAccessToken(token: string): void {
  if (typeof window !== "undefined") window.sessionStorage.setItem(TOKEN_KEY, token);
}
export function clearAccessToken(): void {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_KEY);
}
export function hasAccessToken(): boolean {
  return typeof window !== "undefined" && Boolean(window.sessionStorage.getItem(TOKEN_KEY));
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  if (USE_MOCK) return mockRequest<T>(path, init);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const token = typeof window !== "undefined" ? window.sessionStorage.getItem(TOKEN_KEY) : null;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (authenticated && token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      cache: "no-store",
    });
    const raw = await response.text();
    let payload: unknown = null;
    if (raw) {
      try { payload = JSON.parse(raw); }
      catch { throw new ApiError("The server returned an invalid JSON response.", response.status, raw); }
    }
    if (!response.ok) {
      // Contract error shape: { "error": { "code": "...", "message": "..." } }
      const err = (payload as { error?: { message?: unknown } } | null)?.error;
      const detail = typeof err?.message === "string" ? err.message : `Request failed (${response.status}).`;
      throw new ApiError(detail, response.status, payload);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The request timed out. Please try again.");
    }
    throw new Error("Could not reach the Greenlight API. Check the backend and try again.");
  } finally {
    clearTimeout(timeout);
  }
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
const enc = (value: string) => encodeURIComponent(value);

/** Wire-level API methods. UI components should call repository/adapters, not fetch directly. */
export const api = {
  login: async (body: LoginRequest) => {
    const result = await request<LoginResponse>("/auth/login", json("POST", body), false);
    saveAccessToken(result.access_token);
    return result;
  },
  logout: () => clearAccessToken(),

  getBrandSources: (kind?: SourceKind) => request<BrandSource[]>(
    `/brand-kit/sources${kind ? `?kind=${enc(kind)}` : ""}`,
  ),
  createBrandSource: (body: CreateBrandSourceRequest) => request<BrandSource>("/brand-kit/sources", json("POST", body)),

  getReviews: () => request<ReviewListItem[]>("/reviews"),
  createReview: (body: CreateReviewRequest) => request<CreateReviewResponse>("/reviews", json("POST", body)),
  getReview: (id: string) => request<ReviewDetail>(`/reviews/${enc(id)}`),
  getFindings: (id: string) => request<ApiFinding[]>(`/reviews/${enc(id)}/findings`),
  updateFinding: (findingId: string, body: PatchFindingRequest) => request<PatchFindingResponse>(`/findings/${enc(findingId)}`, json("PATCH", body)),
  addComment: (reviewId: string, body: CreateCommentRequest) => request<CommentResponse>(`/reviews/${enc(reviewId)}/comments`, json("POST", body)),
  approveReview: (reviewId: string, body: WorkflowNoteRequest) => request<WorkflowResponse>(`/reviews/${enc(reviewId)}/approve`, json("POST", body)),
  requestChanges: (reviewId: string, body: WorkflowNoteRequest) => request<WorkflowResponse>(`/reviews/${enc(reviewId)}/request-changes`, json("POST", body)),

  getInsightsSummary: () => request<InsightsSummary>("/insights/summary"),
  getInsightGaps: () => request<InsightGap[]>("/insights/gaps"),
  getAiDisclosure: (reviewId: string) => request<AiDisclosure>(`/reviews/${enc(reviewId)}/ai-disclosure`),
};

export type { FindingAction };
