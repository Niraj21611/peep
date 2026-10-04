"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Category, TransactionType } from "@prisma/client";
import { TransactionWithCategory } from "@/types";
import {
  formatCurrency,
  formatDateDisplay,
  getDerivedDayOfWeek,
  getDerivedMonthYear,
} from "@/lib/utils";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { TransactionDeleteDialog } from "./transaction-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ChevronLeft,
  ChevronRight,
  FilterX,
  FileSpreadsheet,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Loader2,
} from "lucide-react";

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  categories: Category[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize?: number;
  initialSortBy?: string;
  initialSortOrder?: string;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
}

export function TransactionList({
  transactions,
  categories,
  totalCount,
  totalPages,
  currentPage,
  pageSize = 15,
  initialSortBy = "date",
  initialSortOrder = "desc",
  summary,
}: TransactionListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State for Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "ALL");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("categoryId") || "ALL");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  // Modal Dialog States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithCategory | null>(null);

  // Apply filters via URL Query Parameters
  const updateQueryParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 on filter change
    if (!newParams.page && !newParams.pageSize && !newParams.sortBy && !newParams.sortOrder) {
      params.set("page", "1");
    }

    startTransition(() => {
      router.push(`/transactions?${params.toString()}`);
    });
  };

  const handleSort = (column: "date" | "amount") => {
    const isAsc = initialSortBy === column && initialSortOrder === "asc";
    const newOrder = isAsc ? "desc" : "asc";
    updateQueryParams({ sortBy: column, sortOrder: newOrder, page: "1" });
  };

  const renderSortIcon = (column: "date" | "amount") => {
    if (initialSortBy !== column) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-slate-400 inline-block" />;
    return initialSortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-slate-900 dark:text-slate-100 inline-block" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-slate-900 dark:text-slate-100 inline-block" />
    );
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    updateQueryParams({ search: val });
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    updateQueryParams({ type: val });
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    updateQueryParams({ categoryId: val });
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    updateQueryParams({ startDate: val });
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    updateQueryParams({ endDate: val });
  };

  const handlePageSizeChange = (val: string) => {
    updateQueryParams({ pageSize: val, page: "1" });
  };

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setCategoryFilter("ALL");
    setStartDate("");
    setEndDate("");
    startTransition(() => {
      router.push("/transactions");
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/transactions?${params.toString()}`);
    });
  };

  const hasActiveFilters =
    search || typeFilter !== "ALL" || categoryFilter !== "ALL" || startDate || endDate;

  // Pagination calculations
  const fromEntry = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toEntry = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-6">
      {/* Moved PageHeader inside TransactionList, removed total count badge, and added buttons here */}
      <PageHeader
        title="Transaction Ledger"
        description="Log, track, and filter all income and expense transactions. Derived Day and Month attributes are automatically formatted."
      >
        <Button
          variant="outline"
          onClick={() => router.push("/transactions/import")}
          className="gap-2 shrink-0 border-primary/20 text-primary hover:bg-primary/5 shadow-xs"
        >
          <FileSpreadsheet className="h-4 w-4" /> Import CSV
        </Button>
        <Button onClick={() => { setEditingTransaction(null); setFormDialogOpen(true); }} className="gap-2 shrink-0 shadow-xs">
          <Plus className="h-4 w-4" /> Record Transaction
        </Button>
      </PageHeader>

      {/* Aggregate Summary Metrics Cards - Compact UI matching Screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Filtered Income */}
        <Card className="p-3 sm:p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 border-l-[4px] border-l-emerald-500">
          <div className="flex items-start justify-between">
            <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Filtered Income
            </h3>
            <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 mb-0.5 text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalIncome)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Total incoming cash flow
          </p>
        </Card>

        {/* Filtered Expenses */}
        <Card className="p-3 sm:p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 border-l-[4px] border-l-rose-500">
          <div className="flex items-start justify-between">
            <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Filtered Expenses
            </h3>
            <div className="p-1 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <ArrowDownLeft className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5 mb-0.5 text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {formatCurrency(summary.totalExpense)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Total outgoing expenses
          </p>
        </Card>

        {/* Net Flow */}
        <Card className="p-3 sm:p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 border-l-[4px] border-l-blue-500">
          <div className="flex items-start justify-between">
            <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Net Flow
            </h3>
            <div className="p-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div
            className={`mt-1.5 mb-0.5 text-xl font-bold tracking-tight ${
              summary.netBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(summary.netBalance)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Income minus expenses
          </p>
        </Card>
      </div>

      {/* Filters Bar - Aligned perfectly */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-lg">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes or category..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
              <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filters aligned next to dropdowns */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium ml-1">From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="h-9 w-[130px] px-2 text-sm"
            />
            <span className="font-medium ml-1">To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="h-9 w-[130px] px-2 text-sm"
            />
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              <FilterX className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Transaction Table - Bold UI matching Screenshot 2 with Alternate Row Colors */}
      <Card className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs relative">
        {isPending && (
          <div className="absolute inset-0 z-10 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="p-4 space-y-4 pt-12">
              {[...Array(6)].map((_, i) => (
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Updating...</span>
              </div>
            </div>
          </div>
        )}
        
        {transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <th 
                      className={`py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider cursor-pointer select-none transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 ${initialSortBy === "date" ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center">
                        Date {renderSortIcon("date")}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Day</th>
                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Month</th>
                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</th>
                    <th 
                      className={`py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider cursor-pointer select-none transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 ${initialSortBy === "amount" ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center">
                        Amount {renderSortIcon("amount")}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</th>
                    <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors even:bg-slate-50 dark:even:bg-slate-900/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {formatDateDisplay(tx.date)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {getDerivedDayOfWeek(tx.date)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {getDerivedMonthYear(tx.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.type === TransactionType.INCOME ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">
                            Income
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-400 ring-1 ring-inset ring-rose-600/20">
                            Expense
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {tx.category.name}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span
                          className={
                            tx.type === TransactionType.INCOME
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {tx.type === TransactionType.INCOME ? "+" : "-"} {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[200px] truncate">
                        {tx.notes || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingTransaction(tx); setFormDialogOpen(true); }}
                            className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setDeletingTransaction(tx); setDeleteDialogOpen(true); }}
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 gap-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>entries</span>
                </div>
                <span>
                  Showing <strong>{fromEntry}</strong> to <strong>{toEntry}</strong> of <strong>{totalCount}</strong> entries
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(1)}
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Simplified page numbers showing current surrounding */}
                <div className="flex items-center px-2">
                  <Badge variant="secondary" className="px-3 rounded-md text-sm font-semibold">
                    Page {currentPage} of {totalPages}
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(totalPages)}
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 w-fit">
              <Receipt className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">No transactions found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "No financial transactions match your current search or filter criteria."
                  : "You haven't recorded any income or expense transactions yet. Click 'Record Transaction' to get started."}
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Transaction Edit/Create Form Dialog */}
      <TransactionFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        categories={categories}
        transaction={editingTransaction}
      />

      {/* Transaction Delete Confirmation Modal */}
      <TransactionDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        transaction={deletingTransaction}
      />
    </div>
  );
}
