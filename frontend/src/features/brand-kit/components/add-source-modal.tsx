"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button, Field, Input, Modal, Textarea, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { addFact, addRule, addTerm } from "../store";

export type SourceKind = "rule" | "fact" | "term";
const kinds: Array<{ id: SourceKind; label: string }> = [{ id: "rule", label: "Guideline" }, { id: "fact", label: "Approved fact" }, { id: "term", label: "Terminology" }];

export function AddSourceModal({ open, initialKind, onClose }: { open: boolean; initialKind: SourceKind; onClose: () => void }) {
  const { toast } = useToast();
  const [kind, setKind] = useState<SourceKind>(initialKind);
  const [a, setA] = useState(""); const [b, setB] = useState(""); const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Re-sync when reopened with a different starting tab.
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) { setLastOpen(open); if (open) { setKind(initialKind); setA(""); setB(""); setNote(""); setError(""); } }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      if (kind === "rule") await addRule({ title: a, description: note });
      else if (kind === "fact") await addFact({ subject: a, approvedText: note });
      else await addTerm({ avoid: a, use: b, note });
      toast("Added to the Brand Kit. New reviews will use it.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this source.");
    } finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add to Brand Kit" description="Create a source for future content reviews.">
      <form onSubmit={save} className="space-y-4">
        <div className="flex gap-2">
          {kinds.map(k => (
            <button type="button" key={k.id} onClick={() => setKind(k.id)} aria-pressed={kind === k.id}
              className={cn("flex-1 rounded-lg border px-2 py-2.5 text-xs font-bold transition", kind === k.id ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:text-ink")}>{k.label}</button>
          ))}
        </div>
        {kind === "term" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Avoid using"><Input required value={a} onChange={e => setA(e.target.value)} placeholder="e.g. Premium" /></Field>
            <Field label="Preferred term"><Input required value={b} onChange={e => setB(e.target.value)} placeholder="e.g. Signature" /></Field>
          </div>
        ) : (
          <Field label={kind === "rule" ? "Guideline title" : "Fact subject"}><Input required value={a} onChange={e => setA(e.target.value)} placeholder="Enter a clear title…" /></Field>
        )}
        <Field label={kind === "rule" ? "Rule description" : kind === "fact" ? "Approved wording" : "Context (optional)"}>
          <Textarea required={kind !== "term"} rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Describe the approved source…" />
        </Field>
        {error && <p role="alert" className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}><Check size={14} /> Save source</Button></div>
      </form>
    </Modal>
  );
}
