import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { Badge, type Tone } from "./badge";
import { cn } from "@/lib/cn";

type Props = { label: string; value: string | number; hint?: string; trend?: string; trendTone?: Tone; icon?: LucideIcon; tone?: Tone; className?: string };
/** A single figure: label, number, one line of context. No decoration. */
export function StatCard({ label, value, hint, trend, trendTone = "success", icon: Icon, className }: Props) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="flex items-center gap-2">{Icon && <Icon size={15} />}{label}</span>
        {trend && <Badge tone={trendTone}>{trend}</Badge>}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </Card>
  );
}
