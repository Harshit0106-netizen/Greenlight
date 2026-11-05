export type RuleCategory = "Tone" | "Terminology" | "Claims" | "Accessibility" | "Visual";

export interface BrandRule {
  id: string;
  title: string;
  category: RuleCategory;
  description: string;
  source: string;
  status: "Active" | "Needs clarification";
}
export interface ApprovedFact {
  id: string;
  subject: string;
  approvedText: string;
  source: string;
  updatedAt: string;
}
export interface BrandTerm {
  id: string;
  avoid: string;
  use: string;
  note: string;
}
export interface BrandKit {
  rules: BrandRule[];
  facts: ApprovedFact[];
  terms: BrandTerm[];
}
