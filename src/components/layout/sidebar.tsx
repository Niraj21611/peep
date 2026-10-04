

import { Wallet, Shield } from "lucide-react";
import { MAIN_NAV_ITEMS } from "@/constants/navigation";
import { NavigationItem } from "./navigation-item";
import { LogoutButton } from "./logout-button";

interface SidebarProps {
  userEmail: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-background shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="p-2 rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-base leading-none">Finance Tracker</span>
          <span className="text-[11px] text-muted-foreground font-medium">Personal Ledger</span>
        </div>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Main Menu
        </div>
        {MAIN_NAV_ITEMS.map((item) => (
          <NavigationItem key={item.href} item={item} />
        ))}
      </div>

      {/* Bottom User Account Footer */}
      <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        <div className="flex items-center gap-2.5 px-2">
          <div className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold truncate leading-none">{userEmail}</span>
            <span className="text-[10px] text-muted-foreground truncate">Private Session</span>
          </div>
        </div>

        <LogoutButton />
      </div>
    </aside>
  );
}
