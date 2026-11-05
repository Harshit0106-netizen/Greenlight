"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileCheck2, Moon, Plus, Search, Wand2, type LucideIcon } from "lucide-react";
import { flatNavigation } from "@/config/navigation";
import { useReviews } from "@/features/reviews/lib/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";

type Item = { id: string; label: string; hint: string; icon: LucideIcon; run: () => void };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const reviews = useReviews();
  const { toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      { id: "new", label: "New content review", hint: "Action", icon: Plus, run: go("/reviews/new") },
      { id: "demo", label: "Run demo with risky copy", hint: "Action", icon: Wand2, run: go("/reviews/new?sample=risky") },
      { id: "theme", label: "Toggle light / dark theme", hint: "Action", icon: Moon, run: toggle },
      ...flatNavigation.map(n => ({ id: n.href, label: n.name, hint: "Go to", icon: n.icon, run: go(n.href) })),
      ...reviews.slice(0, 8).map(r => ({ id: r.id, label: r.title, hint: r.id, icon: FileCheck2, run: go(`/reviews/${r.id}`) }))
    ];
  }, [reviews, router, toggle]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter(i => `${i.label} ${i.hint}`.toLowerCase().includes(q)) : items;
  }, [items, query]);

  useEffect(() => { if (open) { setQuery(""); setCursor(0); setTimeout(() => input.current?.focus(), 0); } }, [open]);
  useEffect(() => setCursor(0), [query]);
  if (!open) return null;

  const choose = (item?: Item) => { if (!item) return; onClose(); item.run(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(results[cursor]); }
    else if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]">
      <button aria-label="Close search" className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKey}
        className="relative w-full max-w-xl animate-pop overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={17} className="text-muted" />
          <input ref={input} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search reviews, pages and actions…"
            className="h-14 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
          <kbd className="rounded-md border border-line px-1.5 py-1 text-[10px] font-semibold text-muted">ESC</kbd>
        </div>
        <ul role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {results.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.id} role="option" aria-selected={i === cursor}>
                <button onMouseMove={() => setCursor(i)} onClick={() => choose(item)}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition", i === cursor ? "bg-brand/10 text-ink" : "text-ink/80")}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-soft text-muted"><Icon size={15} /></span>
                  <span className="flex-1 truncate font-medium">{item.label}</span>
                  <span className="text-[11px] text-muted">{item.hint}</span>
                  {i === cursor && <ArrowRight size={14} className="text-brand" />}
                </button>
              </li>
            );
          })}
          {!results.length && <li className="px-4 py-10 text-center text-sm text-muted">No results for “{query}”</li>}
        </ul>
      </div>
    </div>
  );
}
