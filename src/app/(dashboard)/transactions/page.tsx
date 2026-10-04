import { requireUser } from "@/lib/auth/session";
import { getTransactionsByUserId } from "@/lib/db/transactions";
import { getCategoriesByUserId } from "@/lib/db/categories";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionType } from "@prisma/client";

interface TransactionsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    type?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = Math.max(5, parseInt(params.pageSize || "15", 10));

  const type =
    params.type === TransactionType.INCOME || params.type === TransactionType.EXPENSE
      ? (params.type as TransactionType)
      : undefined;

  const categoryId = params.categoryId;
  const search = params.search;

  // Default to current month if no date params are provided
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const currentMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

  let startDate: Date | undefined = undefined;
  let startDateStr: string | undefined = undefined;
  if (params.startDate) {
    const d = new Date(params.startDate);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      startDate = d;
      startDateStr = params.startDate;
    }
  } else {
    startDate = currentMonthStart;
    startDateStr = `${currentMonthStart.getUTCFullYear()}-${String(currentMonthStart.getUTCMonth() + 1).padStart(2, "0")}-${String(currentMonthStart.getUTCDate()).padStart(2, "0")}`;
  }

  let endDate: Date | undefined = undefined;
  let endDateStr: string | undefined = undefined;
  if (params.endDate) {
    const d = new Date(params.endDate);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      endDate = d;
      endDateStr = params.endDate;
    }
  } else {
    endDate = currentMonthEnd;
    endDateStr = `${currentMonthEnd.getUTCFullYear()}-${String(currentMonthEnd.getUTCMonth() + 1).padStart(2, "0")}-${String(currentMonthEnd.getUTCDate()).padStart(2, "0")}`;
  }

  const sortBy = params.sortBy === "amount" ? "amount" : "date";
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";

  const [transactionsData, categories] = await Promise.all([
    getTransactionsByUserId(user.id, {
      page,
      pageSize,
      type,
      categoryId,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    }),
    getCategoriesByUserId(user.id, true),
  ]);

  return (
    <div className="space-y-5">
      <TransactionList
        transactions={transactionsData.transactions}
        categories={categories}
        totalCount={transactionsData.totalCount}
        totalPages={transactionsData.totalPages}
        currentPage={transactionsData.currentPage}
        pageSize={transactionsData.pageSize}
        summary={transactionsData.summary}
        initialSortBy={sortBy}
        initialSortOrder={sortOrder}
        defaultStartDate={startDateStr}
        defaultEndDate={endDateStr}
      />
    </div>
  );
}
