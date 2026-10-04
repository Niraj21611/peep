import Link from "next/link";
import { ArrowRight, ShieldCheck, Wallet, PieChart, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-4xl w-full space-y-10 text-center py-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" /> Single-User Private Finance Portal
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Personal Finance Dashboard
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Take total control of your cash flows, category budgets, recurring subscriptions, and ledger entries with full privacy and zero bloat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-2">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                <Wallet className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Transaction Ledger</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Log and track every expense, income stream, and account balance in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-2">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                <PieChart className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Budgets & Categories</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Set category spending limits and monitor budget utilization effortlessly.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-2">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit">
                <Repeat className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Recurring Rules</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Automate regular subscriptions, bill rules, and daily commute expenses.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="pt-2 flex justify-center gap-4">
          <Button asChild size="lg" className="gap-2 shadow-md hover:shadow-lg transition-all">
            <Link href="/login">
              Go to Dashboard Login <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
