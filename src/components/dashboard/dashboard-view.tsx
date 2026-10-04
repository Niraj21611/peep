import {
  DashboardSummaryData,
  CategoryExpenseBreakdown,
  MonthlyComparisonData,
  DashboardHighlights,
  DashboardBudgetSummary,
} from "@/lib/finance/dashboard";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { DashboardDateFilter } from "./dashboard-date-filter";
import { CategoryExpenseChart } from "./category-expense-chart";
import { MonthlyComparisonChart } from "./monthly-comparison-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Percent,
  TrendingDown,
  Award,
  Hash,
  PieChart,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface DashboardViewProps {
  startDateStr: string;
  endDateStr: string;
  summary: DashboardSummaryData;
  categoryExpenses: CategoryExpenseBreakdown[];
  monthlySummary: MonthlyComparisonData[];
  highlights: DashboardHighlights;
  budgetSummary: DashboardBudgetSummary;
}

export function DashboardView({
  startDateStr,
  endDateStr,
  summary,
  categoryExpenses,
  monthlySummary,
  highlights,
  budgetSummary,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <DashboardDateFilter startDateStr={startDateStr} endDateStr={endDateStr} />

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Income
            </CardTitle>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total incoming revenue</p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Expenses
            </CardTitle>
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(summary.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total outgoing cash flow</p>
          </CardContent>
        </Card>

        {/* Net Savings */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Savings
            </CardTitle>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.netSavings >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"
              }`}
            >
              {formatCurrency(summary.netSavings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Income minus expenses</p>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Savings Rate
            </CardTitle>
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {summary.savingsRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Net savings % of income</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables section: Expense by Category & Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Expense by Category Table */}
        <div className="flex flex-col space-y-2">
          <h2 className="text-xl font-bold text-[#1F4E79] dark:text-blue-300">Expense by Category</h2>
          <div className="overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-sm shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#3478C1] text-white">
                <tr>
                  <th className="py-2 px-3 text-left font-bold border-b border-[#3478C1]">Category</th>
                  <th className="py-2 px-3 text-right font-bold border-b border-[#3478C1]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {categoryExpenses.length > 0 ? (
                  categoryExpenses.map((expense) => (
                    <tr key={expense.categoryId} className="border-b border-slate-200 dark:border-slate-800 last:border-0 even:bg-slate-50 dark:even:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="py-1.5 px-3">{expense.name}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-muted-foreground italic">No expenses recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Summary Table */}
        <div className="flex flex-col space-y-2">
          <h2 className="text-xl font-bold text-[#1F4E79] dark:text-blue-300">Monthly Summary</h2>
          <div className="overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-sm shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#3478C1] text-white">
                <tr>
                  <th className="py-2 px-3 text-left font-bold border-b border-[#3478C1]">Month</th>
                  <th className="py-2 px-3 text-right font-bold border-b border-[#3478C1]">Income</th>
                  <th className="py-2 px-3 text-right font-bold border-b border-[#3478C1]">Expenses</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummary.length > 0 ? (
                  monthlySummary.map((month) => (
                    <tr key={month.monthKey} className="border-b border-slate-200 dark:border-slate-800 last:border-0 even:bg-slate-50 dark:even:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="py-1.5 px-3 text-center sm:text-left">{month.month}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{formatCurrency(month.income)}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{formatCurrency(month.expense)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground italic">No monthly data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Responsive Charts Grid (Donut Chart & Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryExpenseChart data={categoryExpenses} />
        <MonthlyComparisonChart data={monthlySummary} />
      </div>

      {/* Additional Highlights & Budget Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Highest Spending Category */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-rose-600">
              <TrendingDown className="h-4 w-4" />
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top Expense Category
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {highlights.highestSpendingCategory ? (
              <div>
                <div className="text-lg font-bold truncate">
                  {highlights.highestSpendingCategory.name}
                </div>
                <div className="text-sm font-semibold text-rose-600 mt-0.5">
                  {formatCurrency(highlights.highestSpendingCategory.amount)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">No expense records</div>
            )}
          </CardContent>
        </Card>

        {/* Largest Single Transaction */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-600">
              <Award className="h-4 w-4" />
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Largest Transaction
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {highlights.largestTransaction ? (
              <div>
                <div className="text-lg font-bold truncate">
                  {formatCurrency(highlights.largestTransaction.amount)}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {highlights.largestTransaction.categoryName} •{" "}
                  {formatDateDisplay(highlights.largestTransaction.date)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">No transactions recorded</div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Count */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-indigo-600">
              <Hash className="h-4 w-4" />
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transaction Volume
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.transactionCount}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Total ledger entries</p>
          </CardContent>
        </Card>

        {/* Budget Overview Widget */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <PieChart className="h-4 w-4" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Budget Target ({budgetSummary.month})
                </CardTitle>
              </div>
              {budgetSummary.overBudgetCount > 0 ? (
                <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] px-1.5 py-0">
                  <AlertTriangle className="h-3 w-3 mr-1" /> {budgetSummary.overBudgetCount} Over
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] px-1.5 py-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> On Track
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">
                Spent {formatCurrency(budgetSummary.totalSpent)}
              </span>
              <span className="font-semibold">Target {formatCurrency(budgetSummary.totalBudget)}</span>
            </div>
            <Progress value={budgetSummary.percentUsed} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
