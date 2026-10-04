import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Wallet, PieChart, Clock } from "lucide-react";

export default async function DashboardPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        description="Comprehensive summary of your personal finances, cash flows, and budget tracking."
      >
        <Badge variant="outline" className="px-3 py-1 font-normal border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">
          Live Connection
        </Badge>
      </PageHeader>

      {/* Semantic Visual State Indicators Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Income
            </CardTitle>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">₹0.00</div>
            <p className="text-xs text-muted-foreground mt-1">Income ledger summary</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Expenses
            </CardTitle>
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">₹0.00</div>
            <p className="text-xs text-muted-foreground mt-1">Expense ledger summary</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Savings
            </CardTitle>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹0.00</div>
            <p className="text-xs text-muted-foreground mt-1">Net surplus cash flow</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Budgets
            </CardTitle>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
              <PieChart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">0 Categories</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly targets</p>
          </CardContent>
        </Card>
      </div>

      {/* Module Overview Placeholder */}
      <Card className="border-dashed">
        <CardHeader className="text-center py-12">
          <div className="mx-auto p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground w-fit mb-4">
            <Clock className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">Dashboard Analytics Module</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Analytical charts, spending breakdown graphs, and cash flow trends will display here as transaction entries are added.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
