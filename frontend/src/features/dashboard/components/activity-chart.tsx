"use client";
import { Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card, CardHeader } from "@/components/ui";
import { chart } from "@/components/ui/chart-theme";
import { activitySeries, sampleKpis } from "../data";

export function ActivityChart() {
  const tick = { fill: chart.muted, fontSize: 11 };
  return (
    <Card className="overflow-hidden">
      <CardHeader icon={Activity} title="Review activity" description="Content checks completed over the last 30 days" action={<Badge>Sample data</Badge>} />
      <div className="px-5 pb-5 pt-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <span className="text-4xl font-bold tracking-tight text-ink">{sampleKpis.totalChecks.toLocaleString()}</span>
            <span className="ml-2 text-xs font-semibold text-success">↑ 18.4%</span>
            <div className="text-xs text-muted">Total checks performed</div>
          </div>
          <div className="flex gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-brand" />This period</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-line" />Previous</span>
          </div>
        </div>
        <div className="h-56" role="img" aria-label="Area chart of daily review checks, this period versus previous">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activitySeries} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="gl-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chart.brand} stopOpacity={0.35} /><stop offset="100%" stopColor={chart.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={chart.line} strokeDasharray="3 4" />
              <XAxis dataKey="day" tick={tick} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={tick} tickLine={false} axisLine={false} />
              <Tooltip {...chart.tooltip} />
              <Area type="monotone" dataKey="previous" name="Previous" stroke={chart.muted} strokeOpacity={0.5} strokeWidth={1.5} fill="none" />
              <Area type="monotone" dataKey="current" name="This period" stroke={chart.brand} strokeWidth={2.5} fill="url(#gl-area)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
