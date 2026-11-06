"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Compass, ShieldCheck } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { LogoMark, Wordmark } from "@/components/layout/logo";
import { LIVE_AVAILABLE, pingApi } from "@/lib/api";
import { useHydrated } from "@/lib/hooks";
import { MOCK_PASSWORD, MOCK_USERS } from "@/lib/mockData";
import { ROLE_LABEL, signIn, useSession } from "@/lib/session";
import { resetReviews } from "@/features/reviews/lib/store";
import { resetTour, setTourOpen } from "@/features/tour/store";

const ROLE_HINT = {
  creator: "Submit a draft and fix what is flagged",
  reviewer: "Approve it or send it back",
  manager: "See everything, read-only",
  brand_admin: "Own the rules and facts",
} as const;

const FEATURES = [
  "Every flag shows the exact quote and the approved rule or fact behind it.",
  "A claim with no evidence is flagged as unsupported, never guessed at.",
  "Creators fix, reviewers decide. The software never approves anything.",
  "The Brand Kit is versioned, and the next review uses the change at once.",
  "Each review records what was and was not sent to an AI service.",
];

type Health = "checking" | "online" | "offline";

export function LoginView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"" | "live" | "demo">("");
  const [error, setError] = useState("");
  const [health, setHealth] = useState<Health>(LIVE_AVAILABLE ? "checking" : "offline");

  useEffect(() => { if (hydrated && user) router.replace("/dashboard"); }, [hydrated, user, router]);
  useEffect(() => {
    if (!LIVE_AVAILABLE) return;
    let live = true;
    pingApi().then(ok => { if (live) setHealth(ok ? "online" : "offline"); });
    return () => { live = false; };
  }, []);

  async function liveSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy("live"); setError("");
    try { await signIn(email, password, "live"); router.replace("/dashboard"); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not sign in."); setBusy(""); }
  }
  async function demoSignIn(role: (typeof MOCK_USERS)[number], fresh = false) {
    setBusy("demo"); setError("");
    try {
      if (fresh) { resetReviews("demo"); resetTour(); }
      setTourOpen(true);
      await signIn(role.email, MOCK_PASSWORD, "demo");
      router.replace("/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not start the demo."); setBusy(""); }
  }

  const creator = MOCK_USERS.find(u => u.role === "creator")!;
  return (
    <main className="grid min-h-screen bg-surface text-ink lg:grid-cols-[minmax(440px,1fr)_1.1fr]">
      <section className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center gap-2.5"><LogoMark size={30} /><Wordmark className="text-lg" /></div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {LIVE_AVAILABLE && (
            <>
              <h1 className="text-3xl font-semibold leading-tight">Sign in</h1>
              <p className="mt-2 text-sm leading-6 text-muted">The backend is live. Sign in with your registered email and password.</p>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted" role="status">
                <span className={`h-2 w-2 rounded-full ${health === "online" ? "bg-success" : health === "checking" ? "animate-pulse bg-warning" : "bg-danger"}`} />
                {health === "online" ? "Live backend online" : health === "checking" ? "Checking the live backend… the first request can take about 10 seconds" : "Live backend not responding. You can still explore the demo below."}
              </p>
              <form onSubmit={liveSignIn} className="mt-6 space-y-4">
                <Field label="Registered email"><Input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></Field>
                <Field label="Password"><Input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></Field>
                {error && <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5 text-xs text-danger">{error}</p>}
                <Button type="submit" size="lg" loading={busy === "live"} disabled={busy === "demo"} className="w-full">Sign in <ArrowRight size={15} /></Button>
              </form>
              <div className="my-8 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />Just looking around?<span className="h-px flex-1 bg-line" /></div>
            </>
          )}

          {!LIVE_AVAILABLE && (
            <>
              <h1 className="text-3xl font-semibold leading-tight">Explore Greenlight</h1>
              <p className="mt-2 text-sm leading-6 text-muted">This deployment runs on built-in sample data, so there is nothing to sign in to. Pick a role to try the product.</p>
              {error && <p role="alert" className="mt-4 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5 text-xs text-danger">{error}</p>}
            </>
          )}

          <div className={LIVE_AVAILABLE ? "" : "mt-6"}>
            <button type="button" disabled={busy !== ""} onClick={() => demoSignIn(creator, true)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-4 text-left transition hover:border-brand hover:bg-brand/10 disabled:opacity-60">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink"><Compass size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">Start the guided demo</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted">A 2-minute walk through the whole workflow, with a checklist that follows you. Sample data, nothing leaves your browser.</span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-brand transition group-hover:translate-x-0.5" />
            </button>

            <div className="mt-5 text-xs font-semibold text-muted">Or jump straight into a role</div>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              {MOCK_USERS.map(u => (
                <button key={u.id} type="button" disabled={busy !== ""} onClick={() => demoSignIn(u)}
                  className="rounded-xl border border-line p-3.5 text-left transition hover:border-brand/50 hover:bg-brand/5 disabled:opacity-60">
                  <span className="block text-sm font-semibold">{ROLE_LABEL[u.role]}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-muted">{ROLE_HINT[u.role]}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted">You can switch role at any time from the menu at the top.</p>
          </div>
        </div>
      </section>

      <aside className="relative hidden flex-col justify-center overflow-hidden bg-[linear-gradient(115deg,#12142e_0%,#161d3d_50%,#0f2f40_100%)] px-14 py-12 text-white lg:flex xl:px-20" aria-label="About Greenlight">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/25 blur-[100px]" />
        <div className="relative">
          <h2 className="max-w-lg text-[42px] font-bold leading-[1.08] tracking-tight">Know what you’re publishing <span className="text-gradient">before you publish it.</span></h2>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-white/65">
            Greenlight reads every draft against your approved brand rules and facts, shows the exact evidence for each flag, and leaves the decision to a person.
          </p>

          <div className="mt-9 max-w-md rounded-2xl border border-white/15 bg-white/[.07] p-5 shadow-2xl backdrop-blur-xl" aria-hidden>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/50"><ShieldCheck size={13} /> Finding · High · Unsupported claim</div>
            <p className="mt-3 text-[15px] leading-7 text-white/85">
              Order today.{" "}
              <mark className="rounded bg-rose-400/25 px-1 text-white underline decoration-rose-300 decoration-wavy decoration-[1.5px] underline-offset-[5px]">India’s #1 fastest delivery, guaranteed.</mark>
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">Approved source</div>
              <p className="mt-1 text-xs leading-5 text-white/70">Guideline G-4.2 · no approved fact supports “#1”.</p>
            </div>
            <div className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-xs text-emerald-100">Suggested: Fast delivery is available in select cities.</div>
          </div>

          <div className="mt-9 text-[11px] font-bold uppercase tracking-[.16em] text-white/45">What you can try</div>
          <ul className="mt-3 max-w-md space-y-2.5">
            {FEATURES.map(f => <li key={f} className="flex items-start gap-3 text-sm leading-6 text-white/80"><Check size={16} className="mt-1 shrink-0 text-emerald-300" />{f}</li>)}
          </ul>
        </div>
      </aside>
    </main>
  );
}
