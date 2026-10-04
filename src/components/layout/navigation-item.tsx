"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Tags,
  Repeat,
  Copy,
} from "lucide-react";

import type { NavItem } from "@/constants/navigation";
import { cn } from "@/lib/utils";

const iconMap = {
  LayoutDashboard,
  Receipt,
  PieChart,
  Tags,
  Repeat,
  Copy,
};

interface NavigationItemProps {
  item: NavItem;
  onClick?: () => void;
}

export function NavigationItem({
  item,
  onClick,
}: NavigationItemProps) {
  const pathname = usePathname();

  const isActive =
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`);

  const Icon = iconMap[item.icon];

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
          isActive
            ? "text-primary-foreground"
            : "text-slate-500 dark:text-slate-400 group-hover:text-foreground"
        )}
      />

      <span>{item.title}</span>
    </Link>
  );
}