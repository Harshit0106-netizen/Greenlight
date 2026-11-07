import { Eye, FileSearch, Fingerprint, Info, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";

const principles = [
  { icon: FileSearch, title: "Contextual analysis", body: "AI can help interpret tone, messaging and nuanced claims against relevant approved sources." },
  { icon: Fingerprint, title: "Evidence verification", body: "Findings must reference a real source and an exact text span before they are shown." },
  { icon: Eye, title: "Visible explanations", body: "The interface shows the issue, why it matters and which approved source supports it." },
  { icon: LockKeyhole, title: "Data minimisation", body: "Only relevant content and matched sources should be sent to an external model." }
];
const oversight = [
  "AI cannot approve or reject content.", "Suggestions are optional and must be reviewed by a person.",
  "Disputed findings remain visible for reviewer consideration.", "Unsupported claims are not automatically labelled false.",
  "Low-confidence findings are clearly identified."
];
const methods = [
  { name: "Rule-based checks", tag: "Deterministic · live", desc: "Terminology, required phrases and explicit rules from your Brand Kit." },
  { name: "Retrieval-supported analysis", tag: "Evidence-linked", desc: "Relevant approved guidelines and facts are retrieved for context." },
  { name: "AI-assisted judgement", tag: "Contextual", desc: "Used for nuanced tone and claim interpretation." },
  { name: "Verification layer", tag: "Live", desc: "Quotes that are not an exact match in your copy are discarded before display." }
];

export function TransparencyView() {
  return (
    <div>
      <PageHeader eyebrow="Trust · Responsible AI" title="AI transparency" description="Understand where automated analysis is used, how findings are verified and where human judgement stays in control." />
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader icon={Sparkles} title="How Greenlight uses AI" description="AI-assisted analysis is designed to support, not replace, reviewers." />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {principles.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-line bg-soft/60 p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand shadow-card"><Icon size={16} /></span>
                  <div className="mt-3 text-sm font-semibold text-ink">{title}</div><p className="mt-1.5 text-sm leading-6 text-muted">{body}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader icon={ShieldCheck} title="Human oversight principles" />
            <ul className="space-y-2.5 p-5">
              {oversight.map(x => <li key={x} className="flex gap-3 rounded-xl border border-line p-3.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"><ShieldCheck size={12} /></span><span className="text-sm leading-5 text-ink/80">{x}</span></li>)}
            </ul>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Analysis methods" action={<Badge tone="brand">Layered design</Badge>} />
            <div className="space-y-4 p-5">
              {methods.map(m => (
                <div key={m.name} className="border-b border-line pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2"><div className="text-sm font-semibold text-ink">{m.name}</div><Badge>{m.tag}</Badge></div>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{m.desc}</p>
                </div>
              ))}
            </div>
          </Card>
          <div className="flex gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-5">
            <Info size={16} className="mt-0.5 shrink-0 text-brand" />
            <div><h2 className="text-xs font-bold text-brand">Current prototype status</h2>
              <p className="mt-1.5 text-sm leading-6 text-ink/75">The frontend runs deterministic local checks against your Brand Kit. Live model calls and authoritative audit records connect through the FastAPI backend.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
