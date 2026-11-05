import { CircleCheck } from "lucide-react";
import { Card, CardHeader, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Finding } from "../types";

const dot = { High: "bg-danger", Medium: "bg-warning", Low: "bg-info" } as const;

export function FindingList({ findings, selectedId, onSelect }: { findings: Finding[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Findings" description="Press J / K to move between findings" />
      {findings.length ? (
        <ul className="space-y-1.5 p-3">
          {findings.map((f, i) => (
            <li key={f.id}>
              <button onClick={() => onSelect(f.id)} aria-current={selectedId === f.id}
                className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                  selectedId === f.id ? "border-brand/40 bg-brand/5 shadow-sm" : "border-transparent hover:border-line hover:bg-soft")}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-soft text-[11px] font-bold text-muted">{i + 1}</span>
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dot[f.severity])} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{f.category}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">“{f.quote}”</span>
                </span>
                <StatusBadge>{f.status}</StatusBadge>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="m-3 rounded-xl border border-success/25 bg-success/10 p-6 text-center">
          <CircleCheck size={24} className="mx-auto text-success" />
          <p className="mt-2 text-sm font-semibold text-success">No issues detected by the configured checks</p>
          <p className="mt-1 text-xs text-muted">This is not a guarantee of compliance. A human should still review the content.</p>
        </div>
      )}
    </Card>
  );
}
