import { workspace } from "@/config/site";
import type { ReviewInput } from "../types";

export const samples = {
  risky: {
    label: "Risky campaign copy",
    input: {
      title: "Diwali campaign launch copy", channel: "Social media", brandKit: workspace.brandKit, mode: "Full brand review",
      intent: "Festive launch post for first-time buyers across tier-1 cities.",
      content: "Celebrate Diwali with the all-new zippy bottle.\n\nIndia's #1 fastest delivery, guaranteed.\n\nA cheap, durable bottle for every family.\n\nHURRY — grab one today, or miss out!!!\n\nImage: diwali-banner.png"
    }
  },
  clean: {
    label: "Compliant copy",
    input: {
      title: "October product update", channel: "Website", brandKit: workspace.brandKit, mode: "Full brand review",
      intent: "Routine product update for existing customers.",
      content: "Meet the Zippy Bottle.\n\nThe Zippy Bottle has a 750 ml capacity and is made with BPA-free, food-grade stainless steel.\n\nFast delivery is available in select cities.\n\nImage: bottle-hero.png — Alt text: a steel bottle on a desk beside a laptop."
    }
  }
} satisfies Record<string, { label: string; input: ReviewInput }>;
