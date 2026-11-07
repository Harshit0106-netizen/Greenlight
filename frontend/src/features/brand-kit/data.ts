import type { BrandKit } from "./types";

export const seedKit: BrandKit = {
  rules: [
    { id: "BR-001", title: "Avoid unsupported superlatives", category: "Claims", description: "Do not use claims such as “#1”, “best” or “fastest” unless an approved fact explicitly substantiates them.", source: "Brand Guidelines v3 · 4.2", status: "Active" },
    { id: "BR-002", title: "Use a helpful, confident tone", category: "Tone", description: "Be clear and reassuring. Avoid pressure tactics, excessive punctuation and fear-based language.", source: "Voice & Tone Guide · 2.1", status: "Active" },
    { id: "BR-003", title: "Use the approved product name", category: "Terminology", description: "Write “Zippy Bottle” with both words capitalised. Do not abbreviate the product name.", source: "Terminology list · T-08", status: "Active" },
    { id: "BR-004", title: "Images need descriptive alt text", category: "Accessibility", description: "Provide concise alt text that communicates the meaningful information in each image.", source: "Accessibility standard · A-03", status: "Active" },
    { id: "BR-005", title: "Use approved brand colours", category: "Visual", description: "Primary blue is #315CE8. Do not introduce unapproved colours in branded graphics.", source: "Visual identity guide · 1.4", status: "Needs clarification" }
  ],
  facts: [
    { id: "F-012", subject: "Delivery coverage", approvedText: "Fast delivery is available in select cities.", source: "Product facts · Delivery · F-012", updatedAt: "Oct 28, 2026" },
    { id: "F-018", subject: "Bottle capacity", approvedText: "The Zippy Bottle has a 750 ml capacity.", source: "Product facts · Specifications · F-018", updatedAt: "Oct 25, 2026" },
    { id: "F-021", subject: "Material", approvedText: "Made with BPA-free, food-grade stainless steel.", source: "Product facts · Materials · F-021", updatedAt: "Oct 20, 2026" }
  ],
  terms: [
    { id: "T-08", avoid: "Zippy bottle", use: "Zippy Bottle", note: "Approved product name and capitalisation" },
    { id: "T-09", avoid: "Cheap", use: "Affordable", note: "Preferred value proposition language" },
    { id: "T-10", avoid: "Best ever", use: "Industry-leading", note: "Use only when supported by approved evidence" }
  ]
};

export const KIT_VERSION = "3.2";
export const brandPalette = [
  { name: "Primary", hex: "#4F5BD5" }, { name: "Ink", hex: "#111827" },
  { name: "Accent", hex: "#A5B4FC" }, { name: "Canvas", hex: "#F6F7FB" }
];
