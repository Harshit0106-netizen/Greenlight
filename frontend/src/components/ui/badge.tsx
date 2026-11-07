import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export const toneStyles: Record<Tone, { chip: string; soft: string; text: string; dot: string }> = {
  neutral: { chip: "bg-soft text-muted ring-line", soft: "bg-soft", text: "text-muted", dot: "bg-muted" },
  brand: { chip: "bg-brand/10 text-brand ring-brand/20", soft: "bg-brand/10", text: "text-brand", dot: "bg-brand" },
  success: { chip: "bg-success/10 text-success ring-success/20", soft: "bg-success/10", text: "text-success", dot: "bg-success" },
  warning: { chip: "bg-warning/10 text-warning ring-warning/25", soft: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  danger: { chip: "bg-danger/10 text-danger ring-danger/20", soft: "bg-danger/10", text: "text-danger", dot: "bg-danger" },
  info: { chip: "bg-info/10 text-info ring-info/20", soft: "bg-info/10", text: "text-info", dot: "bg-info" }
};

export function Badge({ tone = "neutral", dot, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ring-1 ring-inset", toneStyles[tone].chip, className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", toneStyles[tone].dot)} />}
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  approved: "success", accepted: "success", active: "success", published: "success", resolved: "success", edited: "info",
  "needs attention": "danger", high: "danger", "changes requested": "danger", rejected: "danger",
  medium: "warning", "in review": "warning", "needs clarification": "warning", pending: "warning", open: "warning",
  low: "info", disputed: "neutral"
};
export const toneFor = (value: string): Tone => statusTone[value.toLowerCase()] ?? "neutral";

/** One badge for every status, severity and state string in the product. */
export function StatusBadge({ children, dot = true }: { children: string; dot?: boolean }) {
  return <Badge tone={toneFor(children)} dot={dot}>{children}</Badge>;
}
