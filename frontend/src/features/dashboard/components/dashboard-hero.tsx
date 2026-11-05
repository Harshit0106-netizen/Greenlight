import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { buttonClass } from "@/components/ui";

/** Always-dark hero: it is the product pitch, so it keeps its own palette in both themes. */
export function DashboardHero({ firstName }: { firstName: string }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(115deg,#12142e_0%,#161d3d_50%,#0f2f40_100%)] px-6 py-8 shadow-lift md:px-10 md:py-10">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brand/25 blur-[90px]" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-white/80">
            <Sparkles size={12} /> Good morning, {firstName}
          </div>
          <h2 className="mt-4 max-w-xl text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-[42px]">
            Make every piece of content <span className="text-gradient">brand-right.</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/65">
            Greenlight checks copy against your approved standards, shows the exact evidence, and keeps the final decision in human hands.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/reviews/new?sample=risky" className={buttonClass("primary", "lg", "!bg-white !text-[#141c33] hover:!bg-white/90")}><Wand2 size={16} /> Run a 30-second demo</Link>
            <Link href="/brand-kit" className={buttonClass("ghost", "lg", "border border-white/20 !text-white hover:!bg-white/10")}>Explore Brand Kit <ArrowUpRight size={15} /></Link>
          </div>
        </div>

        {/* Product preview: shows what a finding looks like */}
        <div className="relative hidden lg:block" aria-hidden>
          <div className="mx-auto max-w-[400px] rotate-1 rounded-2xl border border-white/15 bg-white/[.07] p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/50"><ShieldCheck size={13} /> Finding · High</div>
            <p className="mt-3 text-[15px] leading-7 text-white/85">
              <mark className="rounded bg-rose-400/25 px-1 text-white underline decoration-rose-300 decoration-wavy decoration-[1.5px] underline-offset-[5px]">India’s #1 fastest delivery, guaranteed.</mark>
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">Approved source</div>
              <p className="mt-1 text-xs leading-5 text-white/70">Brand Guidelines v3 · 4.2 — no approved fact substantiates “#1”.</p>
            </div>
            <div className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-xs text-emerald-100">Fast delivery is available in select cities.</div>
          </div>
          <div className="absolute -bottom-3 left-6 rounded-full border border-emerald-300/30 bg-[#0e2a2a] px-3 py-1.5 text-[11px] font-semibold text-emerald-200 shadow-lg">Human approves · AI never publishes</div>
        </div>
      </div>
    </section>
  );
}
