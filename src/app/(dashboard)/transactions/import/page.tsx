import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { CsvImportView } from "@/components/transactions/csv-import-view";

export default async function CsvImportPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Transactions (CSV)"
        description="Migrate existing Excel or Google Sheets transactions safely. Validates date, category, type, and amount with automatic duplicate detection."
      />

      <CsvImportView />
    </div>
  );
}
