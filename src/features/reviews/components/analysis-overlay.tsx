"use client";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { LogoMark } from "@/components/layout/logo";
import { cn } from "@/lib/cn";

const steps = [
  "Retrieving approved sources from your Brand Kit",
  "Matching claims against approved facts",
  "Checking tone, terminology and accessibility",
  "Verifying every quote against your copy"
];

/** Shown while a review is analysed. Communicates the evidence-first pipeline during a live demo. */
export function AnalysisOverlay({ content }: { content: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => Math.min(a + 1, steps.length)), 480);
    return () => clearInterval(t);
  }, []);
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-rail/80 p-4 backdrop-blur-md">
      <div className="grid w-full max-w-3xl animate-pop gap-0 overflow-hidden rounded-3xl border border-line bg-surface shadow-lift md:grid-cols-2">
        <div className="relative hidden max-h-[360px] overflow-hidden bg-soft p-6 md:block">
          <p className="whitespace-pre-wrap text-sm leading-7 text-ink/70">{content.slice(0, 520)}</p>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div className="absolute inset-x-0 h-16 animate-scan bg-gradient-to-b from-transparent via-brand/25 to-transparent" />
          </div>
        </div>
        <div className="p-7">
          <div className="flex items-center gap-3"><LogoMark size={34} /><div><div className="text-sm font-bold text-ink">Analysing submission</div><div className="text-xs text-muted">Nothing is published automatically</div></div></div>
          <ul className="mt-6 space-y-3.5">
            {steps.map((s, i) => (
              <li key={s} className={cn("flex items-center gap-3 text-sm transition", i <= active ? "text-ink" : "text-muted/60")}>
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", i < active ? "bg-success text-white" : i === active ? "bg-brand/15 text-brand" : "bg-soft")}>
                  {i < active ? <Check size={13} /> : i === active ? <Loader2 size={13} className="animate-spin" /> : null}
                </span>{s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
