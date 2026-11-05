import {
  Activity, BookOpen, CheckCircle2, FileCheck2, Files, LayoutDashboard, Sparkles, type LucideIcon
} from "lucide-react";
import type { UserRole } from "@/types/contract";

export type NavItem = { name: string; href: string; icon: LucideIcon; badge?: "reviews" | "approvals"; roles?: UserRole[] };
export type NavGroup = { label: string; items: NavItem[] };

export const navigation: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { name: "Content reviews", href: "/reviews", icon: FileCheck2, badge: "reviews" },
      { name: "Approvals", href: "/approvals", icon: CheckCircle2, badge: "approvals", roles: ["reviewer", "manager"] },
      { name: "Brand Kit", href: "/brand-kit", icon: BookOpen }
    ]
  },
  {
    label: "Governance",
    items: [
      { name: "Audit history", href: "/history", icon: Files },
      { name: "Insights", href: "/insights", icon: Activity },
      { name: "AI transparency", href: "/ai-transparency", icon: Sparkles }
    ]
  }
];

export const flatNavigation = navigation.flatMap(g => g.items);
