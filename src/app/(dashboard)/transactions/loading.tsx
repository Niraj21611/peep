import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export default function TransactionsLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Transaction Ledger"
        description="Log, track, and filter all income and expense transactions. Derived Day and Month attributes are automatically formatted."
      >
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-40" />
      </PageHeader>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
            <Skeleton className="h-7 w-32 mt-3 mb-1" />
            <Skeleton className="h-3 w-40" />
          </Card>
        ))}
      </div>

      {/* Filters Bar Skeleton */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-lg">
        <Skeleton className="h-9 flex-1 min-w-[200px] rounded-md" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-[130px] rounded-md" />
          <Skeleton className="h-9 w-[150px] rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[130px] rounded-md" />
            <Skeleton className="h-9 w-[130px] rounded-md" />
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <Card className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4 border-b pb-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-8 ml-auto" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
