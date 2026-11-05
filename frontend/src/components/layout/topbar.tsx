"use client";
import { Bell, CircleHelp, Command, Menu, Search } from "lucide-react";
import { currentUser, site } from "@/config/site";
import { Avatar } from "@/components/ui";
import { ThemeToggle } from "./theme-toggle";

type Props = { onMenu: () => void; onSearch: () => void };
export function Topbar({ onMenu, onSearch }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-xl md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenu} aria-label="Open navigation" className="rounded-xl p-2 text-muted transition hover:bg-soft lg:hidden"><Menu size={20} /></button>
        <button onClick={onSearch} aria-label="Search workspace"
          className="flex h-10 w-full min-w-0 max-w-sm items-center gap-2.5 rounded-xl border border-line bg-soft px-3.5 text-sm text-muted transition hover:border-brand/40 sm:w-80">
          <Search size={15} /><span className="flex-1 truncate text-left">Search or jump to…</span>
          <kbd className="hidden items-center gap-0.5 rounded-md border border-line bg-surface px-1.5 py-1 text-[10px] font-semibold sm:inline-flex"><Command size={10} />K</kbd>
        </button>
        <span className="text-sm font-bold sm:hidden">{site.name.toLowerCase()}<span className="text-brand">.</span></span>
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-2 hidden items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-[11px] font-semibold text-success md:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> All systems operational
        </span>
        <button aria-label="Help" className="hidden rounded-xl p-2.5 text-muted transition hover:bg-soft hover:text-ink sm:block"><CircleHelp size={17} /></button>
        <ThemeToggle />
        <button aria-label="Notifications" className="relative rounded-xl p-2.5 text-muted transition hover:bg-soft hover:text-ink">
          <Bell size={17} /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
        </button>
        <div className="mx-2 hidden h-7 w-px bg-line sm:block" />
        <div className="hidden items-center gap-2 sm:flex">
          <Avatar name={currentUser.name} size={32} />
          <span className="text-xs font-semibold text-ink">{currentUser.name}</span>
        </div>
      </div>
    </header>
  );
}
