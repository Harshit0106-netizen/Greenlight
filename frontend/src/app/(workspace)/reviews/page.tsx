import type { Metadata } from "next";
import { ReviewsView } from "@/features/reviews/components/reviews-view";

export const metadata: Metadata = { title: "Content reviews" };

export default function Page() {
  return <ReviewsView />;
}
