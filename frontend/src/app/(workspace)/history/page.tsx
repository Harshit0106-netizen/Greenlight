import type { Metadata } from "next";
import { HistoryView } from "@/features/history/history-view";

export const metadata: Metadata = { title: "Audit history" };

export default function Page() {
  return <HistoryView />;
}
