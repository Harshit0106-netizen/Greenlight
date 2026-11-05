"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, FileText, Info, ScanSearch, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { workspace } from "@/config/site";
import { cn } from "@/lib/cn";
import { can, useSession } from "@/lib/session";
import { createReview } from "../lib/store";
import { samples } from "../lib/samples";
import { CHANNELS, REVIEW_MODES, type ReviewInput } from "../types";
import { AnalysisOverlay } from "./analysis-overlay";

const checks = ["Brand voice and guidelines", "Approved facts and claims", "Terminology and naming", "Accessibility prompts"];
const blank: ReviewInput = { title: "", channel: "Social media", content: "", intent: "", brandKit: workspace.brandKit, mode: "Full brand review" };

export function NewReviewForm() {
  const router = useRouter();
  const role = useSession()?.role;
  const [form, setForm] = useState<ReviewInput>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof ReviewInput>(key: K, value: ReviewInput[K]) => setForm(f => ({ ...f, [key]: value }));

  // /reviews/new?sample=risky|clean preloads demo copy (used by the dashboard and command palette).
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("sample");
    if (key === "risky" || key === "clean") setForm(samples[key].input);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.content.trim().length < 10) { setError("Add at least 10 characters so Greenlight has content to review."); return; }
    setBusy(true);
    try {
      const [review] = await Promise.all([
        createReview({ ...form, title: form.title.trim() || "Untitled content review", content: form.content.trim() }),
        new Promise(r => setTimeout(r, 2100)) // lets the pipeline animation read as intentional
      ]);
      router.push(`/reviews/${review.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The review could not be created. Please try again.");
      setBusy(false);
    }
  }

  if (role && !can.submit(role)) {
    return <div className="rounded-xl border border-line bg-soft p-6 text-sm text-muted">Only creators can submit drafts for review. Switch to a creator account to start one.</div>;
  }

  const words = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;
  return (
    <div>
      <Link href="/reviews" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-brand"><ArrowLeft size={14} /> Back to reviews</Link>
      <PageHeader eyebrow="Content governance · New review" title="Review content before it goes live"
        description="Submit a draft, choose its brand knowledge source and inspect evidence-backed checks before a human makes the call." />

      <form onSubmit={submit} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.72fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader icon={FileText} title="Submission details" description="Give the review enough context to make the results useful." />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Field label="Review title" className="sm:col-span-2"><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Diwali campaign launch copy" /></Field>
              <div className="sm:col-span-2">
                <div className="text-xs font-semibold text-ink">Publishing channel</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHANNELS.map(c => (
                    <button key={c} type="button" onClick={() => set("channel", c)} aria-pressed={form.channel === c}
                      className={cn("rounded-full border px-3.5 py-1.5 text-xs font-semibold transition", form.channel === c ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:border-brand/40 hover:text-ink")}>{c}</button>
                  ))}
                </div>
              </div>
              <Field label="Brand knowledge" className="sm:col-span-2"><Select value={form.brandKit} onChange={e => set("brandKit", e.target.value)}><option>{workspace.brandKit}</option></Select></Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Content to review" description="Paste the copy exactly as it is intended to be published."
              action={<div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setForm(samples.risky.input)}><Wand2 size={13} /> Load risky sample</Button>
                <Button size="sm" variant="ghost" onClick={() => setForm(samples.clean.input)}>Compliant sample</Button>
              </div>} />
            <div className="p-5">
              <Textarea required value={form.content} onChange={e => set("content", e.target.value)} rows={14} className="resize-y bg-soft/60 text-[15px] leading-7"
                placeholder={"Paste headline, body copy, claims and call to action…\n\nThe review checks the text against the selected brand knowledge."} aria-label="Content to review" />
              <div className="mt-3 flex items-center justify-between text-xs text-muted"><span>{words} words · {form.content.length} characters</span><span>Text review · image inspection arrives with the backend</span></div>
            </div>
          </Card>

          <Card>
            <CardHeader icon={Sparkles} title="Review context" description="Optional. Audience, objective or campaign." />
            <div className="p-5"><Textarea value={form.intent} onChange={e => set("intent", e.target.value)} rows={3} placeholder="Who is this for? What should the content achieve?" aria-label="Review context" /></div>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <Card>
            <CardHeader icon={ShieldCheck} title="Review configuration" description="Define the scope of this check." />
            <div className="space-y-4 p-5">
              <div className="text-xs font-semibold text-ink">Review depth</div>
              {REVIEW_MODES.map(m => (
                <button type="button" key={m} onClick={() => set("mode", m)} aria-pressed={form.mode === m}
                  className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm font-medium transition", form.mode === m ? "border-brand/50 bg-brand/5" : "border-line hover:bg-soft")}>
                  <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", form.mode === m ? "border-brand bg-brand text-brand-ink" : "border-muted/50")}>{form.mode === m && <Check size={10} />}</span>{m}
                </button>
              ))}
              <ul className="space-y-2.5 border-t border-line pt-4">
                {checks.map(c => <li key={c} className="flex items-center gap-2 text-sm text-ink/80"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-success/10 text-success"><Check size={12} /></span>{c}</li>)}
              </ul>
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-brand"><Info size={14} /> Explainable by design</div>
                <p className="mt-1 text-xs leading-5 text-ink/70">Every flag points to exact content and the approved source behind it. Reviewers keep the final decision.</p>
              </div>
            </div>
          </Card>
          {error && <p role="alert" className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-xs text-danger">{error}</p>}
          <Button type="submit" size="lg" loading={busy} className="w-full"><ScanSearch size={16} /> Run brand review</Button>
          <p className="text-center text-xs leading-5 text-muted">Uses the FastAPI service when configured; otherwise a clearly labelled local rule-based demo.</p>
        </aside>
      </form>
      {busy && <AnalysisOverlay content={form.content} />}
    </div>
  );
}
