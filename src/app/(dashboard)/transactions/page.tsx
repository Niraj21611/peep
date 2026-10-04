import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";

export default async function TransactionsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="View, log, and filter your income and expense transaction records."
      >
        <Button className="gap-2" disabled>
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
      </PageHeader>

      <Card className="border-dashed">
        <CardHeader className="text-center py-16">
          <div className="mx-auto p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground w-fit mb-4">
            <Receipt className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">Transaction Management Module</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Interactive transaction table, category filtering, date range selection, and transaction creation forms will be implemented in the transaction phase.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
