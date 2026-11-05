"use client";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowUpRight, BarChart3, Lightbulb, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card, CardHeader, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { chart } from "@/components/ui/chart-theme";
import { useReviews } from "@/features/reviews/lib/store";
import { patterns, trend } from "./data";

const barColors = [chart.brand, chart.info, chart.warning, chart.success];
const tick = { fill: chart.muted, fontSize: 11 };

export function InsightsView() {
  const reviews = useReviews();
  const live = { High: 0, Medium: 0, Low: 0 };
  reviews.forEach(r => r.findings.forEach(f => { if (f.status === "Open") live[f.severity]++; }));
  const liveTotal = live.High + live.Medium + live.Low;

  return (
    <div>
      <PageHeader eyebrow="Continuous improvement · Brand intelligence" title="Insights" description="Understand recurring content issues and see where brand guidance needs attention." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Activity} label="Total findings" value={42} hint="Last 30 days · sample" />
        <StatCard icon={Target} tone="success" label="Resolution rate" value="86%" trend="+6%" hint="vs. previous period" />
        <StatCard icon={Lightbulb} tone="warning" label="Guideline gaps" value="03" hint="Potentially unclear rules" />
        <StatCard icon={ShieldCheck} tone="info" label="Brand health" value="86" trend="+4 pts" hint="This month" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader icon={BarChart3} title="Most common findings" description="Where content most often diverges from brand standards" action={<Badge>Sample · 30 days</Badge>} />
          <div className="h-72 p-5" role="img" aria-label="Bar chart of the most common finding categories">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patterns} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid horizontal={false} stroke={chart.line} strokeDasharray="3 4" />
                <XAxis type="number" tick={tick} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ ...tick, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip {...chart.tooltip} cursor={{ fill: "rgb(var(--soft))" }} />
                <Bar dataKey="count" name="Flags" radius={[0, 8, 8, 0]} barSize={22}>{patterns.map((_, i) => <Cell key={i} fill={barColors[i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader icon={TrendingUp} title="Findings vs. resolved" description="Weekly, sample data" />
            <div className="h-40 p-4" role="img" aria-label="Line chart of findings and resolved findings per week">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ left: -24, right: 8, top: 4 }}>
                  <CartesianGrid vertical={false} stroke={chart.line} strokeDasharray="3 4" />
                  <XAxis dataKey="week" tick={tick} tickLine={false} axisLine={false} /><YAxis tick={tick} tickLine={false} axisLine={false} />
                  <Tooltip {...chart.tooltip} />
                  <Line type="monotone" dataKey="findings" name="Findings" stroke={chart.danger} strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="resolved" name="Resolved" stroke={chart.success} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-ink">Live: open findings</h2><Badge tone="brand" dot>Your workspace</Badge></div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {([["High", "text-danger"], ["Medium", "text-warning"], ["Low", "text-info"]] as const).map(([k, c]) => (
                <div key={k} className="rounded-xl bg-soft p-3"><div className={`text-2xl font-bold ${c}`}>{live[k]}</div><div className="mt-0.5 text-xs text-muted">{k}</div></div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">{liveTotal} unresolved across {reviews.length} reviews.</p>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2"><Lightbulb size={17} className="text-warning" /><h2 className="text-sm font-semibold text-ink">Guideline Gap Radar</h2></div>
          <p className="mt-2 text-sm leading-6 text-muted">Repeated disputes can signal unclear guidance, not just creator mistakes.</p>
          <div className="mt-4 rounded-xl border border-warning/25 bg-warning/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-warning"><AlertTriangle size={14} /> Visual identity guide · Colour usage</div>
            <p className="mt-2 text-sm leading-6 text-ink/80">This rule has been disputed repeatedly. Consider clarifying approved use cases and exceptions.</p>
            <div className="mt-3"><StatusBadge>Needs clarification</StatusBadge></div>
          </div>
          <Link href="/brand-kit" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-strong">Review guideline gaps <ArrowUpRight size={12} /></Link>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2"><TrendingUp size={16} className="text-success" /><h2 className="text-sm font-semibold text-ink">Improvement opportunity</h2></div>
          <p className="mt-2 text-sm leading-6 text-muted">Unsupported superlatives account for the largest share of current findings.</p>
          <div className="mt-4 rounded-xl bg-success/10 p-4 text-sm leading-6 text-ink/80">Add approved evidence for comparative claims, or clarify which superlatives are prohibited.</div>
        </Card>
      </div>
    </div>
  );
}
