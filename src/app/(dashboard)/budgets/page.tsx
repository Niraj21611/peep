import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PieChart } from "lucide-react";

export default async function BudgetsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Budgets"
        description="Set category spending limits and track budget utilization in real-time."
      >
        <Button className="gap-2" disabled>
          <Plus className="h-4 w-4" /> Set Budget
        </Button>
      </PageHeader>

      <Card className="border-dashed">
        <CardHeader className="text-center py-16">
          <div className="mx-auto p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground w-fit mb-4">
            <PieChart className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">Budget Tracking Module</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Category monthly limit configurations, progress utilization bars, and over-budget warning notifications will be implemented in the budget phase.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
