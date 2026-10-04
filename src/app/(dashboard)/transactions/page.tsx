import { requireUser } from "@/lib/auth/session";
import { getTransactionsByUserId } from "@/lib/db/transactions";
import { getCategoriesByUserId } from "@/lib/db/categories";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Badge } from "@/components/ui/badge";
import { TransactionType } from "@prisma/client";

interface TransactionsPageProps {
  searchParams: {
    page?: string;
    type?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const user = await requireUser();

  const page = parseInt(searchParams.page || "1", 10);
  const type =
    searchParams.type === TransactionType.INCOME || searchParams.type === TransactionType.EXPENSE
      ? (searchParams.type as TransactionType)
      : undefined;
  const categoryId = searchParams.categoryId;
  const search = searchParams.search;
  const startDate = searchParams.startDate ? new Date(searchParams.startDate) : undefined;
  const endDate = searchParams.endDate ? new Date(searchParams.endDate) : undefined;

  const [transactionsData, categories] = await Promise.all([
    getTransactionsByUserId(user.id, {
      page,
      pageSize: 15,
      type,
      categoryId,
      search,
      startDate,
      endDate,
    }),
    getCategoriesByUserId(user.id, true),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Ledger"
        description="Log, track, and filter all income and expense transactions. Derived Day and Month attributes are automatically formatted."
      >
        <Badge variant="outline" className="px-3 py-1 font-normal text-xs">
          {transactionsData.totalCount} Total Entries
        </Badge>
      </PageHeader>

      <TransactionList
        transactions={transactionsData.transactions}
        categories={categories}
        totalCount={transactionsData.totalCount}
        totalPages={transactionsData.totalPages}
        currentPage={transactionsData.currentPage}
        summary={transactionsData.summary}
      />
    </div>
  );
}
