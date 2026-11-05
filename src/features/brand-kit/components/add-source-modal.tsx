"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button, Field, Input, Modal, Select, Textarea, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { addFact, addRule, addTerm } from "../store";
import type { RuleCategory } from "../types";

export type SourceKind = "rule" | "fact" | "term";
const kinds: Array<{ id: SourceKind; label: string }> = [{ id: "rule", label: "Guideline" }, { id: "fact", label: "Approved fact" }, { id: "term", label: "Terminology" }];
const categories: RuleCategory[] = ["Tone", "Terminology", "Claims", "Accessibility", "Visual"];

export function AddSourceModal({ open, initialKind, onClose }: { open: boolean; initialKind: SourceKind; onClose: () => void }) {
  const { toast } = useToast();
  const [kind, setKind] = useState<SourceKind>(initialKind);
  const [a, setA] = useState(""); const [b, setB] = useState(""); const [note, setNote] = useState("");
  const [category, setCategory] = useState<RuleCategory>("Tone");
  const [source, setSource] = useState("Workspace addition");

  // Re-sync when reopened with a different starting tab.
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) { setLastOpen(open); if (open) { setKind(initialKind); setA(""); setB(""); setNote(""); } }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (kind === "rule") addRule({ title: a.trim(), description: note.trim(), category, source });
    else if (kind === "fact") addFact({ subject: a.trim(), approvedText: note.trim(), source });
    else addTerm({ avoid: a.trim(), use: b.trim(), note: note.trim() || "Added from the workspace" });
    toast("Added to the Brand Kit. New reviews will use it immediately.");
    onClose();
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
        {kind === "rule" && <Field label="Category"><Select value={category} onChange={e => setCategory(e.target.value as RuleCategory)}>{categories.map(c => <option key={c}>{c}</option>)}</Select></Field>}
        <Field label={kind === "rule" ? "Rule description" : kind === "fact" ? "Approved wording" : "Context (optional)"}>
          <Textarea required={kind !== "term"} rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Describe the approved source…" />
        </Field>
        {kind !== "term" && <Field label="Source reference"><Input value={source} onChange={e => setSource(e.target.value)} /></Field>}
        <div className="flex justify-end gap-2 pt-1"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit"><Check size={14} /> Save source</Button></div>
      </form>
    </Modal>
  );
}
