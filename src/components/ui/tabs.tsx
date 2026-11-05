"use client";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type TabItem<T extends string> = { id: T; label: string; icon?: LucideIcon; count?: number };
type Props<T extends string> = { items: TabItem<T>[]; value: T; onChange: (id: T) => void; className?: string };

export function Tabs<T extends string>({ items, value, onChange, className }: Props<T>) {
  return (
    <div role="tablist" className={cn("scroll-hide flex gap-1 overflow-x-auto border-b border-line px-3 pt-2", className)}>
      {items.map(({ id, label, icon: Icon, count }) => {
        const active = id === value;
        return (
          <button key={id} role="tab" aria-selected={active} onClick={() => onChange(id)}
            className={cn("flex shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-4 py-3 text-xs font-semibold transition",
              active ? "border-brand bg-brand/5 text-brand" : "border-transparent text-muted hover:bg-soft hover:text-ink")}>
            {Icon && <Icon size={14} />}{label}
            {count !== undefined && <span className={cn("rounded-md px-1.5 py-0.5 text-[10px]", active ? "bg-brand/15" : "bg-soft")}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
