import { requireUser } from "@/lib/auth/session";
import { getRecurringTransactionsByUserId } from "@/lib/db/recurring";
import { getCategoriesByUserId } from "@/lib/db/categories";
import { PageHeader } from "@/components/layout/page-header";
import { RecurringList } from "@/components/recurring/recurring-list";
import { Badge } from "@/components/ui/badge";

export default async function RecurringPage() {
  const user = await requireUser();

  const [rules, categories] = await Promise.all([
    getRecurringTransactionsByUserId(user.id, false),
    getCategoriesByUserId(user.id, true),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Transactions"
        description="Automate repetitive expenses and subscriptions. Rules generate actual financial ledger transactions idempotently without duplicate entries."
      >
        <Badge variant="outline" className="px-3 py-1 font-normal text-xs">
          {rules.length} Total Rules
        </Badge>
      </PageHeader>

      <RecurringList rules={rules} categories={categories} />
    </div>
  );
}
