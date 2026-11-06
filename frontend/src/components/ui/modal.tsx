"use client";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; className?: string };
export function Modal({ open, onClose, title, description, children, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close dialog" className="absolute inset-0 animate-fade-in bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className={cn("relative w-full max-w-lg animate-pop rounded-2xl border border-line bg-surface p-6 shadow-lift", className)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-xs text-muted">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-muted transition hover:bg-soft hover:text-ink"><X size={16} /></button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
