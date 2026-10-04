"use client";

import { useState } from "react";
import { Menu, Wallet, Shield } from "lucide-react";
import { MAIN_NAV_ITEMS } from "@/constants/navigation";
import { NavigationItem } from "./navigation-item";
import { LogoutButton } from "./logout-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileNavProps {
  userEmail: string;
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        {/* Brand Header */}
        <SheetHeader className="h-16 border-b px-6 justify-center text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <SheetTitle className="font-bold tracking-tight text-base leading-none">
                Finance Tracker
              </SheetTitle>
              <span className="text-[11px] text-muted-foreground font-medium">
                Personal Ledger
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </div>
          {MAIN_NAV_ITEMS.map((item) => (
            <NavigationItem key={item.href} item={item} onClick={() => setOpen(false)} />
          ))}
        </div>

        {/* User Account Footer */}
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
      </SheetContent>
    </Sheet>
  );
}
