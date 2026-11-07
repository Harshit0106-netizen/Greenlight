import type { Metadata } from "next";
import { ReviewWorkspace } from "@/features/reviews/components/review-workspace";

export const metadata: Metadata = { title: "Review" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReviewWorkspace id={id} />;
}
