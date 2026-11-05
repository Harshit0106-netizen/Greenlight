import { getBrandKit } from "@/features/brand-kit/store";
import type { BrandKit } from "@/features/brand-kit/types";
import { uid } from "@/lib/format";
import type { Finding, FindingSeverity, ReviewAnalysis, ReviewInput } from "../types";

/**
 * Deterministic, explainable demo checks. Deliberately NOT presented as an AI model.
 * It reads the live Brand Kit, so editing a term or rule changes what gets flagged.
 */
type Draft = Omit<Finding, "id" | "status">;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const CLAIMS = /#\s?1\b|\bno\.?\s?1\b|\bnumber\s+one\b|\b(?:the\s+)?best(?:-selling)?\b|\bfastest\b|\bguaranteed?\b|\b100\s?%\b|\bzero[- ]risk\b|\bclinically\s+proven\b|\bcarbon[- ]neutral\b|\bmarket[- ]leader(?:s)?\b|\bmarket[- ]leading\b|\bindustry[- ]leader(?:s)?\b|\bindustry[- ]leading\b|\bleading\s+(?:the\s+field|in\s+the\s+field|producer(?:s)?|manufacturer(?:s)?|provider(?:s)?|brand(?:s)?|supplier(?:s)?)\b|\bleader\s+in\s+the\s+field\b|\btop[- ]ranked\b/gi;
const URGENCY = /[^.!?\n]*(?:!{2,}|\b(?:don['’]t miss out|miss out|act now|hurry|last chance|limited time only)\b)[^.!?\n]*!*[.!?]*/gi;
const IMAGE_REF = /\b[\w-]+\.(?:png|jpe?g|gif|webp)\b|\[image\]/gi;
const SHOUTING = /\b[A-Z]{5,}\b/g;


export function analyseLocally(input: ReviewInput, kit: BrandKit = getBrandKit()): ReviewAnalysis {
  const text = input.content;
  const drafts: Draft[] = [];
  const ranges: Array<[number, number]> = [];
  const rule = (id: string) => kit.rules.find(r => r.id === id && r.status === "Active");
  const src = (id: string, fallback: string) => { const r = rule(id); return r ? `${r.source} · ${r.title}` : fallback; };

  function add(d: Draft, start: number) {
    const end = start + d.quote.length;
    if (ranges.some(([s, e]) => start < e && end > s)) return;
    ranges.push([start, end]);
    drafts.push(d);
  }
  const trimmed = (m: RegExpMatchArray) => {
    const raw = m[0]; const lead = raw.length - raw.trimStart().length;
    return { quote: raw.trim(), start: (m.index ?? 0) + lead };
  };

  // 1 · Unsupported claims
  for (const m of text.matchAll(CLAIMS)) {
    const { quote, start } = trimmed(m);
    if (quote.length < 2) continue;
    add({
      category: "Unsupported claim", severity: "High", quote, ruleId: "BR-001", confidence: 88, suggestionKind: "guidance",
      reason: "This wording implies a comparative, leadership or absolute claim. The local demo can identify the wording, but cannot establish whether the claim is true. A reviewer must verify current, relevant substantiation before publication.",
      receipt: `${src("BR-001", "Brand Guidelines · Claims policy")}. The local demo did not match this wording to a specific approved substantiation record. Check the claim's scope, source, date and comparison set.`,
      suggestion: "Attach a current, approved source that substantiates this exact claim, or rewrite it as a specific product benefit that does not imply market superiority."
    }, start);
  }

  // 2 · Tone and pressure language
  for (const m of text.matchAll(URGENCY)) {
    const { quote, start } = trimmed(m);
    if (quote.length < 4) continue;
    add({
      category: "Tone and messaging", severity: "Medium", quote, ruleId: "BR-002", confidence: 86, suggestionKind: "replace",
      reason: "Urgency language or repeated exclamation marks may conflict with the helpful, confident brand voice. Review the full sentence in context.",
      receipt: src("BR-002", "Voice & Tone Guide · Tone guidance"),
      suggestion: "Review the wording against the approved voice and tone guidance."
    }, start);
  }

  // 3 · Terminology (driven by the live Brand Kit)
  for (const term of kit.terms) {
    if (!term.avoid.trim()) continue;
    const pattern = new RegExp(`\\b${escape(term.avoid.trim())}\\b`, "gi");
    for (const m of text.matchAll(pattern)) {
      if (m[0] === term.use) continue; // already correct
      add({
        category: "Terminology", severity: "Medium", quote: m[0], ruleId: term.id, confidence: 97, suggestionKind: "replace",
        reason: `“${m[0]}” does not match the approved language. ${term.note}.`,
        receipt: `Terminology list · ${term.id} — avoid “${term.avoid}”, use “${term.use}”`,
        suggestion: term.use
      }, m.index ?? 0);
    }
  }

  // 4 · Accessibility prompts
  if (!/alt\s*text\s*:/i.test(text)) {
    for (const m of text.matchAll(IMAGE_REF)) {
      add({
        category: "Accessibility", severity: "Low", quote: m[0], ruleId: "BR-004", confidence: 94, suggestionKind: "guidance",
        reason: "An image is referenced without descriptive alternative text in the submitted copy. This prompts human verification; the actual asset is not inspected.",
        receipt: src("BR-004", "Accessibility standard · A-03"),
        suggestion: `${m[0]} — Alt text: describe the image’s subject and purpose.`
      }, m.index ?? 0);
    }
  }

  // 5 · Excessive capitalisation (skipped when already inside another finding)
  for (const m of text.matchAll(SHOUTING)) {
    const start = m.index ?? 0;
    if (ranges.some(([s, e]) => start >= s && start + m[0].length <= e)) continue;
    add({
      category: "Tone and messaging", severity: "Low", quote: m[0], ruleId: "BR-002", confidence: 80, suggestionKind: "replace",
      reason: "All-caps words read as shouting and conflict with the calm, confident voice.",
      receipt: src("BR-002", "Voice & Tone Guide · Tone guidance"),
      suggestion: m[0].charAt(0) + m[0].slice(1).toLowerCase()
    }, start);
  }

  const findings: Finding[] = drafts.map(d => ({ ...d, id: uid("FD"), status: "Open" }));
  const order = { High: 0, Medium: 1, Low: 2 } as Record<FindingSeverity, number>;
  findings.sort((a, b) => order[a.severity] - order[b.severity] || text.indexOf(a.quote) - text.indexOf(b.quote));
  return {
    findings, provider: "local-demo",
    summary: `${findings.length} potential issue${findings.length === 1 ? "" : "s"} detected by local rule checks. Human review is required.`
  };
}
