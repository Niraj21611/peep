import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Tags,
  Repeat,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Financial overview and analytical summary",
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: Receipt,
    description: "Manage income, expenses, and ledger entries",
  },
  {
    title: "Budgets",
    href: "/budgets",
    icon: PieChart,
    description: "Set and track category monthly spending limits",
  },
  {
    title: "Categories",
    href: "/categories",
    icon: Tags,
    description: "Manage dynamic income and expense categories",
  },
  {
    title: "Recurring Transactions",
    href: "/recurring",
    icon: Repeat,
    description: "Manage periodic subscriptions and bill templates",
  },
];
