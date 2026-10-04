import { MobileNav } from "./mobile-nav";
import { LogoutButton } from "./logout-button";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  userEmail: string;
}

export function Header({ userEmail }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 sm:px-6 backdrop-blur">
      <MobileNav userEmail={userEmail} />

      <div className="flex-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 px-2.5 py-1 text-xs font-normal">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Session
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border">
            <User className="h-3.5 w-3.5" />
            <span className="truncate max-w-[150px] sm:max-w-[200px]">{userEmail}</span>
          </div>

          <div className="hidden sm:block">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
