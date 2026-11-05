import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { Badge, toneStyles, type Tone } from "./badge";
import { cn } from "@/lib/cn";

type Props = { label: string; value: string | number; hint?: string; trend?: string; trendTone?: Tone; icon: LucideIcon; tone?: Tone; className?: string };
export function StatCard({ label, value, hint, trend, trendTone = "success", icon: Icon, tone = "brand", className }: Props) {
  return (
    <Card className={cn("group p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift", className)}>
      <div className="flex items-start justify-between">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", toneStyles[tone].soft, toneStyles[tone].text)}><Icon size={20} /></span>
        {trend && <Badge tone={trendTone}>{trend}</Badge>}
      </div>
      <div className="mt-4 text-[32px] font-bold leading-none tracking-tight text-ink">{value}</div>
      <div className="mt-2 text-sm font-medium text-ink/80">{label}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </Card>
  );
}
