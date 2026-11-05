import { uid } from "@/lib/format";
import { analyseLocally } from "./engine";
import type { Finding, ReviewAnalysis, ReviewInput } from "../types";

type RawFinding = Partial<Finding> & { quote?: string };

/** Coerces an API finding into the UI contract. Confidence may arrive as 0–1 or 0–100. */
function normalise(raw: RawFinding): Finding | null {
  if (!raw.quote) return null;
  const c = typeof raw.confidence === "number" ? raw.confidence : 80;
  return {
    id: raw.id || uid("FD"), category: raw.category || "Finding", severity: raw.severity || "Medium",
    quote: raw.quote, reason: raw.reason || "", receipt: raw.receipt || "No source reference supplied by the API.",
    suggestion: raw.suggestion || "", suggestionKind: raw.suggestionKind || "replace",
    confidence: Math.round(c <= 1 ? c * 100 : c), status: "Open", ruleId: raw.ruleId
  };
}

/**
 * Provider boundary. Set NEXT_PUBLIC_API_BASE_URL to use the FastAPI service; otherwise (or on failure)
 * the clearly-labelled local demo checks run. API output passes a verification layer: any finding whose
 * quote is not an exact substring of the submission is discarded, never shown.
 */
export async function analyseReview(input: ReviewInput): Promise<ReviewAnalysis> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (base) {
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/v1/reviews/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.title, channel: input.channel, content: input.content, intent: input.intent, brand_kit: input.brandKit, mode: input.mode })
      });
      if (!res.ok) throw new Error(`Review API returned ${res.status}`);
      const payload = await res.json();
      const all = (Array.isArray(payload.findings) ? payload.findings : []).map(normalise).filter(Boolean) as Finding[];
      const verified = all.filter(f => input.content.includes(f.quote));
      const discarded = all.length - verified.length;

      // Safety net: deterministic local checks must not be silently cleared by a thin API response.
      const local = analyseLocally(input);
      const extra = local.findings.filter(lf => !verified.some(vf => vf.quote.toLowerCase().includes(lf.quote.toLowerCase())));
      return {
        findings: [...verified, ...extra], provider: "api", discarded,
        summary: [
          payload.summary,
          discarded ? `${discarded} unverifiable finding${discarded === 1 ? "" : "s"} discarded.` : "",
          extra.length ? `Local safety checks added ${extra.length} flag${extra.length === 1 ? "" : "s"}.` : ""
        ].filter(Boolean).join(" ")
      };
    } catch (error) {
      console.warn("Greenlight API unavailable; using clearly labelled local demo checks.", error);
    }
  }
  return analyseLocally(input);
}
