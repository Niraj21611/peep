import Link from "next/link";
import { ArrowRight, ShieldCheck, Wallet, PieChart, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <ShieldCheck className="w-4 h-4" /> Single-User Private Finance Tracker
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Personal Finance Dashboard
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Take total control of your income, expenses, budgets, categories, and recurring transactions with full privacy and zero bloat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <Card>
            <CardHeader>
              <Wallet className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Track every expense, income stream, and account balance in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <PieChart className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Budgets & Categories</CardTitle>
              <CardDescription>
                Set spending targets by category and monitor budget utilization effortlessy.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Repeat className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Recurring Expenses</CardTitle>
              <CardDescription>
                Automate regular subscriptions and recurring bill tracking.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/login">
              Go to Dashboard Login <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
