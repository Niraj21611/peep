import { requireUser } from "@/lib/auth/session";
import { getBudgetsWithCalculations } from "@/lib/db/budgets";
import { PageHeader } from "@/components/layout/page-header";
import { BudgetView } from "@/components/budgets/budget-view";
import { Badge } from "@/components/ui/badge";

interface BudgetsPageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const user = await requireUser();
  const params = await searchParams;

  // Default to current month "YYYY-MM"
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let targetMonth = currentMonthStr;
  if (typeof params.month === "string") {
    const match = params.month.match(/^(\d{4})-(\d{1,2})$/);
    if (match && match[1] && match[2]) {
      const year = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (year >= 1970 && year <= 2100 && m >= 1 && m <= 12) {
        targetMonth = `${year}-${String(m).padStart(2, "0")}`;
      }
    }
  }

  const { categoryBudgets, summary } = await getBudgetsWithCalculations(user.id, targetMonth);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Budgets"
        description="Set category spending targets and track actual expenses in real-time. Categories and actual spending are computed dynamically."
      >
        <Badge variant="outline" className="px-3 py-1 font-normal text-xs">
          Target Month: {targetMonth}
        </Badge>
      </PageHeader>

      <BudgetView
        month={targetMonth}
        categoryBudgets={categoryBudgets}
        summary={summary}
      />
    </div>
  );
}
