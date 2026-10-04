import { requireUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/layout/logout-button";
import { Wallet, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
              <div className="p-1.5 rounded-md bg-primary text-primary-foreground">
                <Wallet className="h-5 w-5" />
              </div>
              <span>Finance Tracker</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
              <UserIcon className="h-3.5 w-3.5" />
              <span>{user.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container px-4 sm:px-8 py-6">{children}</main>
    </div>
  );
}
