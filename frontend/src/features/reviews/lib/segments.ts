import type { Finding } from "../types";

export type Segment = { text: string; finding?: Finding };

/** Splits copy into plain and highlighted runs so findings can be marked inline. */
export function buildSegments(text: string, findings: Finding[]): Segment[] {
  const marks = findings
    .map(finding => {
      const needle = finding.status === "Edited" && finding.resolvedText ? finding.resolvedText : finding.quote;
      return { finding, needle, start: text.indexOf(needle) };
    })
    .filter(m => m.start >= 0)
    .sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let cursor = 0;
  for (const { finding, needle, start } of marks) {
    if (start < cursor) continue; // overlapping marks: the earlier one wins
    if (start > cursor) out.push({ text: text.slice(cursor, start) });
    out.push({ text: needle, finding });
    cursor = start + needle.length;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}
