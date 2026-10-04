"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  categories: Category[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
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
  summary,
}: TransactionListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
    if (!newParams.page) {
      params.set("page", "1");
    }

    router.push(`/transactions?${params.toString()}`);
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

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setCategoryFilter("ALL");
    setStartDate("");
    setEndDate("");
    router.push("/transactions");
  };

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (tx: TransactionWithCategory) => {
    setEditingTransaction(tx);
    setFormDialogOpen(true);
  };

  const handleOpenDelete = (tx: TransactionWithCategory) => {
    setDeletingTransaction(tx);
    setDeleteDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/transactions?${params.toString()}`);
  };

  const hasActiveFilters =
    search || typeFilter !== "ALL" || categoryFilter !== "ALL" || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Aggregate Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Filtered Income
            </CardTitle>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(summary.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total incoming cash flow</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Filtered Expenses
            </CardTitle>
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(summary.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total outgoing expenses</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Flow
            </CardTitle>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.netBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"
              }`}
            >
              {formatCurrency(summary.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Income minus expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions & Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes or category..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[140px]">
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
              <SelectTrigger className="w-[170px]">
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
          </div>

          <Button onClick={handleOpenAdd} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Record Transaction
          </Button>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="h-8 w-[140px] text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="h-8 w-[140px] text-xs"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <FilterX className="h-3.5 w-3.5" /> Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Transaction Table */}
      <Card className="overflow-hidden border">
        {transactions.length > 0 ? (
          <>
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Day</TableHead>
                  <TableHead className="font-semibold">Month</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDateDisplay(tx.date)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {getDerivedDayOfWeek(tx.date)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {getDerivedMonthYear(tx.date)}
                    </TableCell>
                    <TableCell>
                      {tx.type === TransactionType.INCOME ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Income
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                          Expense
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{tx.category.name}</TableCell>
                    <TableCell className="whitespace-nowrap font-bold">
                      <span
                        className={
                          tx.type === TransactionType.INCOME
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        {tx.type === TransactionType.INCOME ? "+" : "-"} {formatCurrency(tx.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {tx.notes || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(tx)}
                          title="Edit transaction"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(tx)}
                          title="Delete transaction"
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t bg-slate-50/50 dark:bg-slate-900/50 text-xs text-muted-foreground">
              <span>
                Showing <strong>{transactions.length}</strong> of <strong>{totalCount}</strong> transactions
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>

                <span>
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="h-8 gap-1"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground w-fit">
              <Receipt className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base">No transactions found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
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
