"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "info" | "warning";
type Toast = { id: number; message: string; tone: ToastTone };
type Ctx = { toast: (message: string, tone?: ToastTone) => void };

const ToastContext = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

const icons = { success: CheckCircle2, info: Info, warning: TriangleAlert };
const colors = { success: "text-success", info: "text-info", warning: "text-warning" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const dismiss = (id: number) => setItems(list => list.filter(t => t.id !== id));
  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.random();
    setItems(list => [...list.slice(-3), { id, message, tone }]);
    setTimeout(() => setItems(list => list.filter(t => t.id !== id)), 3800);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
        {items.map(t => {
          const Icon = icons[t.tone];
          return (
            <div key={t.id} className="pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-lift">
              <Icon size={17} className={cn("mt-0.5 shrink-0", colors[t.tone])} />
              <p className="flex-1 text-sm text-ink">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-ink"><X size={14} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
