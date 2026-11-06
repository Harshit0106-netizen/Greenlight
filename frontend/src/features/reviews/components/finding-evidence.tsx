"use client";
import { useState } from "react";
import { Check, CheckCheck, ChevronLeft, ChevronRight, Copy, Pencil, ShieldQuestion, ThumbsDown } from "lucide-react";
import { Button, Card, CardHeader, StatusBadge, Textarea, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Finding, FindingStatus } from "../types";

type Props = {
  finding?: Finding;
  canApply: boolean;
  /** Only the creator of the review can resolve findings; others read the evidence. */
  canResolve: boolean;
  busy?: boolean;
  /** 1-based position and total, with a stepper (J / K also work). */
  position?: { index: number; total: number; onStep: (delta: -1 | 1) => void };
  onDecide: (status: Extract<FindingStatus, "Accepted" | "Disputed">, reason?: string) => void;
  onApply: () => void;
  onRewrite: (text: string) => void;
};

const Label = ({ children }: { children: string }) => <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{children}</div>;

export function FindingEvidence({ finding, canApply, canResolve, busy, position, onDecide, onApply, onRewrite }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState("");

  if (!finding) {
    return (
      <Card><CardHeader icon={ShieldQuestion} title="Finding" />
        <p className="p-10 text-center text-sm text-muted">Choose a finding to inspect its evidence.</p></Card>
    );
  }
  const f = finding;
  const replaceable = (f.suggestionKind ?? "replace") === "replace";
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${f.category}\n${f.reason}\nEvidence: ${f.receipt}\nSuggested fix: ${f.suggestion}`); toast("Evidence copied to clipboard."); }
    catch { toast("Clipboard permission is unavailable in this browser.", "warning"); }
  };

  return (
    <Card key={f.id} className="animate-fade-in overflow-hidden">
      <CardHeader icon={ShieldQuestion} title={position ? `Finding ${position.index} of ${position.total}` : "Finding"}
        action={<div className="flex items-center gap-2">
          <StatusBadge>{f.status}</StatusBadge>
          {position && position.total > 1 && (<div className="flex">
            <button onClick={() => position.onStep(-1)} disabled={position.index <= 1} aria-label="Previous finding" className="rounded-md p-1.5 text-muted transition hover:bg-soft disabled:opacity-30"><ChevronLeft size={16} /></button>
            <button onClick={() => position.onStep(1)} disabled={position.index >= position.total} aria-label="Next finding" className="rounded-md p-1.5 text-muted transition hover:bg-soft disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>)}
        </div>} />
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge dot={false}>{f.severity}</StatusBadge>
          <span className="text-sm font-semibold text-ink">{f.category}</span>
          <span className="ml-auto text-xs text-muted">{f.method === "ai_assisted" ? "AI-assisted · verified against your text" : "Rule-based check"} · {f.confidence}% confidence</span>
        </div>

        <div className={cn("rounded-lg border-l-4 p-4", f.status === "Edited" ? "border-success bg-success/10" : "border-danger bg-danger/10")}>
          {f.status === "Edited" ? (
            <>
              {f.originalQuote && (<><Label>Original wording</Label><p className="mt-1.5 text-[15px] leading-6 text-ink line-through decoration-danger/50">“{f.originalQuote}”</p></>)}
              <p className={cn("text-[15px] leading-6 text-success", f.originalQuote && "mt-2")}>Now reads: “{f.resolvedText ?? f.quote}”</p>
            </>
          ) : (<><Label>Matched content</Label><p className="mt-1.5 text-[15px] leading-6 text-ink">“{f.quote}”</p></>)}
        </div>

        <div><Label>Why this was flagged</Label><p className="mt-2 text-sm leading-6 text-ink/80">{f.reason}</p></div>

        <div className="rounded-xl border border-line bg-soft p-4">
          <div className="flex items-center justify-between"><Label>Approved source · receipt</Label>
            <button onClick={copy} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-strong"><Copy size={12} /> Copy evidence</button></div>
          <p className="mt-2 text-sm leading-6 text-ink/90">{f.receipt}</p>
        </div>

        {f.decisionReason && f.status !== "Open" && (
          <div><Label>Decision note</Label><p className="mt-2 text-sm leading-6 text-ink/80">{f.decisionReason}</p></div>
        )}

        <div>
          <Label>{replaceable ? "Suggested correction · optional" : "Suggested action · for a human to complete"}</Label>
          {editing ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs leading-5 text-muted">Replace only the highlighted phrase in the draft. This does not approve the review.</p>
              <Textarea rows={3} value={text} onChange={e => setText(e.target.value)} autoFocus aria-label="Replacement wording for highlighted phrase" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" loading={busy} onClick={() => { if (text.trim() && text.trim() !== f.quote) { onRewrite(text.trim()); setEditing(false); } }} disabled={!text.trim() || text.trim() === f.quote || !canApply}><Check size={13} /> Save replacement to draft</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-2 rounded-xl border border-success/25 bg-success/10 p-3 text-sm leading-6 text-ink">{f.suggestion}</div>
              {canResolve && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {replaceable && <Button size="sm" loading={busy} onClick={onApply} disabled={!canApply || f.status === "Edited"}><Check size={13} /> Apply suggested replacement</Button>}
                  <Button size="sm" variant="secondary" onClick={() => { setText(f.quote); setEditing(true); }} disabled={!canApply || busy}><Pencil size={13} /> Write replacement</Button>
                </div>
              )}
              {!canApply && f.status !== "Edited" && <p className="mt-2 text-xs text-warning">The flagged phrase is no longer present in the draft. Reload the review.</p>}
            </>
          )}
        </div>

        <div className="border-t border-line pt-4">
          <Label>Human decision · classify this finding</Label>
          {canResolve ? (
            disputing ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs leading-5 text-muted">Say why this does not apply. The reason is recorded and shown to the reviewer.</p>
                <Textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} autoFocus aria-label="Reason this finding does not apply" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" loading={busy} disabled={!reason.trim()} onClick={() => { onDecide("Disputed", reason.trim()); setDisputing(false); setReason(""); }}><ThumbsDown size={13} /> Mark as not applicable</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setDisputing(false); setReason(""); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={busy || f.status === "Accepted"} onClick={() => onDecide("Accepted")}><CheckCheck size={13} /> Confirm this is a valid issue</Button>
                <Button size="sm" variant="secondary" disabled={busy || f.status === "Disputed"} onClick={() => setDisputing(true)}><ThumbsDown size={13} /> Mark as not applicable</Button>
              </div>
            )
          ) : (
            <p className="mt-2 text-xs leading-5 text-muted">Only the creator of this review can confirm, edit or dispute findings. You can read the evidence and decision here.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
