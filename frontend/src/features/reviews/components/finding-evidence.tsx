"use client";
import { useState } from "react";
import { Check, CheckCheck, Copy, Pencil, RotateCcw, ShieldQuestion, ThumbsDown } from "lucide-react";
import { Button, Card, CardHeader, StatusBadge, Textarea, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Finding, FindingStatus, AnalysisSource } from "../types";

type Props = {
  finding?: Finding;
  source: AnalysisSource;
  canApply: boolean;
  onDecide: (status: FindingStatus) => void;
  onApply: () => void;
  onRewrite: (text: string) => void;
};

const Label = ({ children }: { children: string }) => <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{children}</div>;

export function FindingEvidence({ finding, source, canApply, onDecide, onApply, onRewrite }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  if (!finding) {
    return (
      <Card><CardHeader icon={ShieldQuestion} title="Finding evidence" />
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
      <CardHeader icon={ShieldQuestion} title="Finding evidence" action={<StatusBadge>{f.status}</StatusBadge>} />
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge dot={false}>{f.severity}</StatusBadge>
          <span className="text-sm font-semibold text-ink">{f.category}</span>
          <span className="ml-auto text-xs text-muted">
            {source === "local-demo" ? "Deterministic rule check" : "Backend finding"}
          </span>
        </div>

        <div className={cn("rounded-xl border-l-4 p-4", f.status === "Edited" ? "border-success bg-success/10" : "border-danger bg-danger/10")}>
          <Label>{f.status === "Edited" ? "Original wording" : "Matched content"}</Label>
          <p className={cn("mt-1.5 text-[15px] leading-6 text-ink", f.status === "Edited" && "line-through decoration-danger/50")}>“{f.quote}”</p>
          {f.status === "Edited" && f.resolvedText && <p className="mt-2 text-[15px] leading-6 text-success">Now reads: “{f.resolvedText}”</p>}
        </div>

        <div><Label>Why this was flagged</Label><p className="mt-2 text-sm leading-6 text-ink/80">{f.reason}</p></div>

        <div className="rounded-xl border border-line bg-soft p-4">
          <div className="flex items-center justify-between"><Label>Approved source · receipt</Label>
            <button onClick={copy} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-strong"><Copy size={12} /> Copy evidence</button></div>
          <p className="mt-2 text-sm leading-6 text-ink/90">{f.receipt}</p>
        </div>

        <div>
          <Label>{replaceable ? "Suggested correction · reviewer discretion" : "Suggested action · for a human to complete"}</Label>
          {editing ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs leading-5 text-muted">Replace only the highlighted phrase in the submitted draft. This does not mark the finding as not applicable or approve the review.</p>
              <Textarea rows={3} value={text} onChange={e => setText(e.target.value)} autoFocus aria-label="Replacement wording for highlighted phrase" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { if (text.trim() && text.trim() !== f.quote) { onRewrite(text.trim()); setEditing(false); } }} disabled={!text.trim() || text.trim() === f.quote || !canApply}><Check size={13} /> Save replacement to draft</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-2 rounded-xl border border-success/25 bg-success/10 p-3 text-sm leading-6 text-ink">{f.suggestion}</div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {replaceable && <Button size="sm" onClick={onApply} disabled={!canApply || f.status === "Edited"}><Check size={13} /> Apply suggested replacement</Button>}
                <Button size="sm" variant="secondary" onClick={() => { setText(f.quote); setEditing(true); }} disabled={!canApply}><Pencil size={13} /> Write replacement</Button>
              </div>
              {!canApply && f.status !== "Edited" && <p className="mt-2 text-xs text-warning">The flagged phrase is no longer present in the draft. Re-run analysis or review the updated copy.</p>}
            </>
          )}
        </div>

        <div className="border-t border-line pt-4">
          <Label>Human decision · classify this finding</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => onDecide("Accepted")} disabled={f.status === "Accepted"}><CheckCheck size={13} /> Confirm this is a valid issue</Button>
            <Button size="sm" variant="secondary" onClick={() => onDecide("Disputed")} disabled={f.status === "Disputed"}><ThumbsDown size={13} /> Mark as not applicable</Button>
            {f.status !== "Open" && <Button size="sm" variant="ghost" onClick={() => onDecide("Open")}><RotateCcw size={13} /> Reopen</Button>}
          </div>
        </div>
      </div>
    </Card>
  );
}
