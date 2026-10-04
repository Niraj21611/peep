import { requireUser } from "@/lib/auth/session";
import {
  getDashboardSummary,
  getExpensesByCategory,
  getMonthlySummary,
  getDashboardHighlights,
  getDashboardBudgetOverview,
} from "@/lib/finance/dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Badge } from "@/components/ui/badge";
import { formatDateForInput } from "@/lib/utils";

interface DashboardPageProps {
  searchParams: {
    startDate?: string;
    endDate?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser();

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const startDate = searchParams.startDate
    ? new Date(`${searchParams.startDate}T00:00:00.000Z`)
    : defaultStart;
  const endDate = searchParams.endDate
    ? new Date(`${searchParams.endDate}T23:59:59.999Z`)
    : defaultEnd;

  const startDateStr = formatDateForInput(startDate);
  const endDateStr = formatDateForInput(endDate);

  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [summary, categoryExpenses, monthlySummary, highlights, budgetSummary] =
    await Promise.all([
      getDashboardSummary(user.id, startDate, endDate),
      getExpensesByCategory(user.id, startDate, endDate),
      getMonthlySummary(user.id, 6),
      getDashboardHighlights(user.id, startDate, endDate),
      getDashboardBudgetOverview(user.id, currentMonthKey),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        description="Real-time financial analytics, spending breakdowns, and cash flow trends computed directly from your database."
      >
        <Badge variant="outline" className="px-3 py-1 font-normal text-xs">
          {startDateStr} to {endDateStr}
        </Badge>
      </PageHeader>

      <DashboardView
        startDateStr={startDateStr}
        endDateStr={endDateStr}
        summary={summary}
        categoryExpenses={categoryExpenses}
        monthlySummary={monthlySummary}
        highlights={highlights}
        budgetSummary={budgetSummary}
      />
    </div>
  );
}
