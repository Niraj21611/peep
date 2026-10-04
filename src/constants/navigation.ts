export const MAIN_NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    description: "Financial overview and analytical summary",
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: "Receipt",
    description: "Manage income, expenses, and ledger entries",
  },
  {
    title: "Templates",
    href: "/templates",
    icon: "Copy",
    description: "Manage quick transaction templates and amount chunks",
  },
  {
    title: "Budgets",
    href: "/budgets",
    icon: "PieChart",
    description: "Set and track category monthly spending limits",
  },
  {
    title: "Categories",
    href: "/categories",
    icon: "Tags",
    description: "Manage dynamic income and expense categories",
  },
  {
    title: "Recurring Transactions",
    href: "/recurring",
    icon: "Repeat",
    description: "Manage periodic subscriptions and bill templates",
  },
] as const;

export type NavItem = (typeof MAIN_NAV_ITEMS)[number];