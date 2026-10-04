import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Repeat } from "lucide-react";

export default async function RecurringPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Transactions"
        description="Set up recurring bills, subscriptions, and periodic income templates."
      >
        <Button className="gap-2" disabled>
          <Plus className="h-4 w-4" /> Add Recurring Rule
        </Button>
      </PageHeader>

      <Card className="border-dashed">
        <CardHeader className="text-center py-16">
          <div className="mx-auto p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground w-fit mb-4">
            <Repeat className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">Recurring Expenses Module</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Periodic frequency rules (Daily, Weekly, Monthly, Yearly, Custom) and scheduled entry creation will be implemented in the recurring expense phase.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
