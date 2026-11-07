import type { Metadata } from "next";
import { TransparencyView } from "@/features/transparency/transparency-view";

export const metadata: Metadata = { title: "AI transparency" };

export default function Page() {
  return <TransparencyView />;
}
