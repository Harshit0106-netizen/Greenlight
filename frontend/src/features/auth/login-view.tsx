"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { LogoMark } from "@/components/layout/logo";
import { site } from "@/config/site";
import { USE_MOCK } from "@/lib/api";
import { useHydrated } from "@/lib/hooks";
import { MOCK_PASSWORD, MOCK_USERS } from "@/lib/mockData";
import { ROLE_LABEL, signIn, useSession } from "@/lib/session";

const ROLE_HINT = {
  creator: "Submits drafts and resolves findings",
  reviewer: "Approves or requests changes",
  manager: "Sees the whole workspace",
  brand_admin: "Maintains the Brand Kit",
} as const;

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
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10 text-ink">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <LogoMark size={40} />
          <div className="text-xl font-extrabold tracking-tight">{site.name.toLowerCase()}<span className="text-brand">.</span></div>
        </div>
        <Card className="p-6">
          <h1 className="text-lg font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-muted">{site.tagline}</p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Email"><Input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></Field>
            <Field label="Password"><Input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></Field>
            {error && <p role="alert" className="rounded-xl border border-danger/25 bg-danger/10 p-3 text-xs text-danger">{error}</p>}
            <Button type="submit" size="lg" loading={busy} className="w-full"><LogIn size={16} /> Sign in</Button>
          </form>
        </Card>

        {USE_MOCK && (
          <Card className="mt-4 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted">Demo mode · mock data</div>
            <p className="mt-1 text-xs leading-5 text-muted">Pick a role to try the product. Each role sees and can do different things, exactly as on the live service.</p>
            <div className="mt-3 grid gap-2">
              {MOCK_USERS.map(u => (
                <button key={u.id} type="button" disabled={busy} onClick={e => submit(e, { email: u.email, password: MOCK_PASSWORD })}
                  className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5 text-left transition hover:border-brand/40 hover:bg-brand/5 disabled:opacity-60">
                  <span><span className="block text-sm font-semibold">{u.name}</span><span className="block text-xs text-muted">{ROLE_HINT[u.role]}</span></span>
                  <span className="rounded-md bg-soft px-2 py-1 text-[11px] font-bold text-muted">{ROLE_LABEL[u.role]}</span>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
