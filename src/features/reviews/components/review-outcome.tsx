import { CheckCheck, MessageSquareWarning, ShieldCheck } from "lucide-react";
import { Button, Card, CardHeader } from "@/components/ui";
import { approvalBlockerCount } from "../lib/metrics";
import type { Review } from "../types";

type Props = { review: Review; onApprove: () => void; onRequestChanges: () => void };

export function ReviewOutcome({ review, onApprove, onRequestChanges }: Props) {
  const blockers = approvalBlockerCount(review);
  const approved = review.status === "Approved";
  return (
    <Card>
      <CardHeader icon={ShieldCheck} title="Review outcome" description="Greenlight surfaces conflicts. A person owns the publication decision." />
      <div className="p-5">
        {approved ? (
          <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/10 p-4 text-sm font-semibold text-success"><CheckCheck size={18} /> Approved for publication</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={onApprove} disabled={blockers > 0}><CheckCheck size={15} /> Approve content</Button>
            <Button variant="secondary" onClick={onRequestChanges} disabled={review.status === "Changes requested"}><MessageSquareWarning size={15} /> Request changes</Button>
          </div>
        )}
        {blockers > 0 && <p className="mt-3 text-xs text-warning">Review every open or confirmed finding before approval. Correct valid issues in the draft, or mark findings not applicable when the flag is incorrect. ({blockers} blocker{blockers === 1 ? "" : "s"} remaining.)</p>}
      </div>
    </Card>
  );
}
