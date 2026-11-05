import type { Metadata } from "next";
import { BrandKitView } from "@/features/brand-kit/components/brand-kit-view";

export const metadata: Metadata = { title: "Brand Kit" };

export default function Page() {
  return <BrandKitView />;
}
