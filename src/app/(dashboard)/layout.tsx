import { requireUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex bg-slate-50/50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <Sidebar userEmail={user.email} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header userEmail={user.email} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-full space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
