"use client";
import { Command, Menu, Search } from "lucide-react";
import { Avatar } from "@/components/ui";
import { USE_MOCK } from "@/lib/api";
import { ROLE_LABEL, useSession } from "@/lib/session";
import { ThemeToggle } from "./theme-toggle";

type Props = { onMenu: () => void; onSearch: () => void };
export function Topbar({ onMenu, onSearch }: Props) {
  const user = useSession();
  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-xl md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenu} aria-label="Open navigation" className="rounded-xl p-2 text-muted transition hover:bg-soft lg:hidden"><Menu size={20} /></button>
        <button onClick={onSearch} aria-label="Search workspace"
          className="flex h-10 w-full min-w-0 max-w-sm items-center gap-2.5 rounded-xl border border-line bg-soft px-3.5 text-sm text-muted transition hover:border-brand/40 sm:w-80">
          <Search size={15} /><span className="flex-1 truncate text-left">Search or jump to…</span>
          <kbd className="hidden items-center gap-0.5 rounded-md border border-line bg-surface px-1.5 py-1 text-[10px] font-semibold sm:inline-flex"><Command size={10} />K</kbd>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <span title={USE_MOCK ? "Sample data, nothing is sent to a server" : "Connected to the Greenlight API"}
          className={`mr-2 hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold md:flex ${USE_MOCK ? "border-warning/25 bg-warning/10 text-warning" : "border-success/20 bg-success/10 text-success"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${USE_MOCK ? "bg-warning" : "animate-pulse bg-success"}`} />{USE_MOCK ? "Sample data" : "Live"}
        </span>
        <ThemeToggle />
        <div className="mx-2 hidden h-7 w-px bg-line sm:block" />
        <div className="hidden items-center gap-2 sm:flex">
          <Avatar name={user?.name ?? "—"} size={32} />
          <span className="text-xs font-semibold text-ink">{user?.name}{user && <span className="ml-1.5 font-medium text-muted">· {ROLE_LABEL[user.role]}</span>}</span>
        </div>
      </div>
    </header>
  );
}
