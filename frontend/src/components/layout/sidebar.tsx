"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Plus, Settings2, ShieldCheck } from "lucide-react";
import { currentUser, site, workspace } from "@/config/site";
import { navigation } from "@/config/navigation";
import { useReviews } from "@/features/reviews/lib/store";
import { isPending } from "@/features/reviews/lib/metrics";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { LogoMark } from "./logo";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const reviews = useReviews();
  const counts = { reviews: reviews.length, approvals: reviews.filter(isPending).length };
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col bg-rail text-rail-ink">
      <div className="flex h-[72px] items-center gap-3 border-b border-rail-ink/10 px-5">
        <LogoMark size={38} />
        <div>
          <div className="text-[17px] font-extrabold tracking-tight">{site.name.toLowerCase()}<span className="text-brand">.</span></div>
          <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-rail-ink/45">Brand intelligence</div>
        </div>
      </div>

      <button className="mx-4 mt-5 flex items-center gap-3 rounded-xl border border-rail-ink/10 bg-rail-ink/[.04] p-3 text-left transition hover:border-brand/40">
        <Avatar name={workspace.name} size={34} className="bg-brand/20 text-brand" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold">{workspace.name}</div>
          <div className="text-[11px] text-rail-ink/50">Brand workspace</div>
        </div>
        <ChevronDown size={15} className="text-rail-ink/40" />
      </button>

      <div className="px-4 pt-4">
        <Link href="/reviews/new" onClick={onNavigate}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-brand-ink shadow-glow transition hover:bg-brand-strong active:scale-[.98]">
          <Plus size={16} /> New content review
        </Link>
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {navigation.map(group => (
          <div key={group.label}>
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-rail-ink/35">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const count = item.badge ? counts[item.badge] : undefined;
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
                    className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition",
                      active ? "bg-brand/15 text-rail-ink" : "text-rail-ink/60 hover:bg-rail-ink/5 hover:text-rail-ink")}>
                    {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-brand" />}
                    <Icon size={17} className={active ? "text-brand" : "text-rail-ink/45 group-hover:text-rail-ink/80"} />
                    <span className="flex-1">{item.name}</span>
                    {count ? <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", active ? "bg-brand/25 text-brand" : "bg-rail-ink/10 text-rail-ink/55")}>{count}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-rail-ink/10 p-3">
        <div className="mb-3 rounded-xl border border-success/25 bg-success/10 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-success"><ShieldCheck size={14} /> Governance active</div>
          <p className="mt-1 text-[11px] leading-4 text-rail-ink/55">Kit v{workspace.kitVersion} is live. Every check cites an approved source.</p>
        </div>
        <Link href="/settings" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-rail-ink/60 transition hover:bg-rail-ink/5 hover:text-rail-ink">
          <Settings2 size={17} className="text-rail-ink/45" /> Settings
        </Link>
        <div className="mt-1 flex items-center gap-2.5 rounded-xl p-2.5">
          <Avatar name={currentUser.name} size={32} className="bg-brand/20 text-brand" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold">{currentUser.name}</div>
            <div className="text-[11px] text-rail-ink/50">{currentUser.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
