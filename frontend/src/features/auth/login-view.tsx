"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { LogoMark, Wordmark } from "@/components/layout/logo";
import { USE_MOCK } from "@/lib/api";
import { useHydrated } from "@/lib/hooks";
import { MOCK_PASSWORD, MOCK_USERS } from "@/lib/mockData";
import { ROLE_LABEL, signIn, useSession } from "@/lib/session";

const ROLE_HINT = {
  creator: "Submit a draft and fix what is flagged",
  reviewer: "Approve it or send it back",
  manager: "See everything, read-only",
  brand_admin: "Own the rules and facts",
} as const;

const PROOF = [
  "Every flag cites the approved rule or fact behind it.",
  "Claims without evidence are flagged, never guessed at.",
  "Only a person can approve. The software never publishes.",
];

export function LoginView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (hydrated && user) router.replace("/dashboard"); }, [hydrated, user, router]);

  async function submit(e: React.FormEvent, creds = { email, password }) {
    e.preventDefault();
    setBusy(true); setError("");
    try { await signIn(creds.email, creds.password); router.replace("/dashboard"); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not sign in."); setBusy(false); }
  }

  return (
    <main className="grid min-h-screen bg-surface text-ink lg:grid-cols-[minmax(420px,1fr)_1.1fr]">
      <section className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center gap-2.5"><LogoMark size={30} /><Wordmark className="text-lg" /></div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-3xl font-semibold leading-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Check content against your brand before it goes out.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Work email"><Input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></Field>
            <Field label="Password"><Input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></Field>
            {error && <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5 text-xs text-danger">{error}</p>}
            <Button type="submit" size="lg" loading={busy} className="w-full">Continue <ArrowRight size={15} /></Button>
          </form>

          {USE_MOCK && (
            <div className="mt-10">
              <div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />Or explore the demo as<span className="h-px flex-1 bg-line" /></div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {MOCK_USERS.map(u => (
                  <button key={u.id} type="button" disabled={busy} onClick={e => submit(e, { email: u.email, password: MOCK_PASSWORD })}
                    className="rounded-xl border border-line p-3.5 text-left transition hover:border-brand/50 hover:bg-brand/5 disabled:opacity-60">
                    <span className="block text-sm font-semibold">{ROLE_LABEL[u.role]}</span>
                    <span className="mt-0.5 block text-xs leading-4 text-muted">{ROLE_HINT[u.role]}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-muted">Sample data. Nothing leaves your browser.</p>
            </div>
          )}
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

          <div className="mt-10 max-w-md rounded-2xl border border-white/15 bg-white/[.07] p-5 shadow-2xl backdrop-blur-xl" aria-hidden>
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

          <ul className="mt-10 max-w-md space-y-3">
            {PROOF.map(p => <li key={p} className="flex items-start gap-3 text-sm text-white/80"><Check size={16} className="mt-0.5 shrink-0 text-emerald-300" />{p}</li>)}
          </ul>
        </div>
      </aside>
    </main>
  );
}
