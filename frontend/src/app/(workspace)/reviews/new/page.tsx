import type { Metadata } from "next";
import { NewReviewForm } from "@/features/reviews/components/new-review-form";

export const metadata: Metadata = { title: "New review" };

export default function Page() {
  return <NewReviewForm />;
}
