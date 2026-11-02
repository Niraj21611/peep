"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Category, TransactionType } from "@prisma/client";
import { TripGroupWithDetails, TransactionWithCategory, TripGroupBudgetWithCategory } from "@/types";
import { cn, formatCurrency, formatDateDisplay, formatDateForInput } from "@/lib/utils";
import {
  updateTripGroupAction,
  deleteTripGroupAction,
  removeTransactionFromTripGroupAction,
  upsertTripGroupBudgetAction,
  deleteTripGroupBudgetAction,
} from "@/actions/trip-groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Briefcase,
  Pencil,
  Trash2,
  X,
  Receipt,
  Wallet,
  Target,
  Plus,
  Loader2,
  Calendar,
  BarChart3,
  TrendingUp,
  Check,
  AlertTriangle,
  AlertCircle,
  Users,
} from "lucide-react";

interface TripGroupDetailProps {
  tripGroup: TripGroupWithDetails;
  categories: Category[];
}

export function TripGroupDetail({ tripGroup, categories }: TripGroupDetailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Remove transaction dialog
  const [removeTxDialogOpen, setRemoveTxDialogOpen] = useState(false);
  const [removingTx, setRemovingTx] = useState<TransactionWithCategory | null>(null);

  // Budget dialog
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string>("");

  // Delete budget dialog
  const [deleteBudgetDialogOpen, setDeleteBudgetDialogOpen] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<TripGroupBudgetWithCategory | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute statistics
  let totalExpense = 0;
  const expenseByCategory: Record<string, { name: string; amount: number }> = {};
  const spenderBreakdown: Record<string, number> = {};

  for (const tx of tripGroup.transactions) {
    if (tx.type === TransactionType.EXPENSE) {
      totalExpense += tx.amount;

      // Category breakdown for budgets
      const existing = expenseByCategory[tx.categoryId];
      if (existing) {
        existing.amount += tx.amount;
      } else {
        expenseByCategory[tx.categoryId] = { name: tx.category.name, amount: tx.amount };
      }
    }

    // Notes-based spender breakdown (if notes contain "Paid by: <name>" or similar)
    if (tx.notes) {
      const paidByMatch = tx.notes.match(/paid\s+by[:\s]+(.+)/i);
      if (paidByMatch && paidByMatch[1]) {
        const spender = paidByMatch[1].trim();
        spenderBreakdown[spender] = (spenderBreakdown[spender] ?? 0) + tx.amount;
      }
    }
  }

  const totalBudget = tripGroup.budgets.reduce((sum, b) => sum + b.amount, 0);
  const budgetUtilization = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;
  const totalRemaining = totalBudget - totalExpense;

  // Build budget vs actual data
  const budgetVsActual = tripGroup.budgets.map((b) => {
    const actual = expenseByCategory[b.categoryId]?.amount || 0;
    const percentage = b.amount > 0 ? (actual / b.amount) * 100 : 0;
    return {
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.category.name,
      budgeted: b.amount,
      actual,
      difference: b.amount - actual,
      percentage,
    };
  });

  // Categories already used in budgets
  const budgetedCategoryIds = new Set(tripGroup.budgets.map((b) => b.categoryId));
  const availableBudgetCategories = categories.filter(
    (c) => !budgetedCategoryIds.has(c.id) && (c.type === "EXPENSE" || c.type === "BOTH")
  );

  // Status badge helper
  const getBudgetStatus = (budgeted: number, actual: number) => {
    if (budgeted <= 0) {
      return {
        label: "No Target",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
        indicatorClass: "bg-slate-400",
        icon: null,
      };
    }
    const percent = (actual / budgeted) * 100;
    if (percent > 100) {
      return {
        label: "Over Budget",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400",
        indicatorClass: "bg-rose-600",
        icon: <AlertTriangle className="h-3 w-3" />,
      };
    }
    if (percent >= 85) {
      return {
        label: "Near Limit",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
        indicatorClass: "bg-amber-500",
        icon: <AlertCircle className="h-3 w-3" />,
      };
    }
    return {
      label: "Within Budget",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400",
      indicatorClass: "bg-teal-500",
      icon: <Check className="h-3 w-3" />,
    };
  };

  // --- Handlers ---

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEditError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateTripGroupAction(tripGroup.id, formData);

    if (result.success) {
      setEditDialogOpen(false);
      startTransition(() => router.refresh());
    } else {
      setEditError(result.message || "Failed to update.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const result = await deleteTripGroupAction(tripGroup.id);
    if (result.success) {
      router.push("/trip-groups");
    }
    setIsSubmitting(false);
  };

  const handleRemoveTransaction = async () => {
    if (!removingTx) return;
    setIsSubmitting(true);

    const result = await removeTransactionFromTripGroupAction(removingTx.id);
    if (result.success) {
      setRemoveTxDialogOpen(false);
      setRemovingTx(null);
      startTransition(() => router.refresh());
    }
    setIsSubmitting(false);
  };

  const handleAddBudget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBudgetError(null);

    const formData = new FormData(e.currentTarget);
    if (!selectedBudgetCategory) {
      formData.set("categoryId", "");
    } else {
      formData.set("categoryId", selectedBudgetCategory);
    }

    const result = await upsertTripGroupBudgetAction(tripGroup.id, formData);

    if (result.success) {
      setBudgetDialogOpen(false);
      setSelectedBudgetCategory("");
      startTransition(() => router.refresh());
    } else {
      setBudgetError(result.message || "Failed to add budget.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;
    setIsSubmitting(true);

    const result = await deleteTripGroupBudgetAction(deletingBudget.id, tripGroup.id);
    if (result.success) {
      setDeleteBudgetDialogOpen(false);
      setDeletingBudget(null);
      startTransition(() => router.refresh());
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/trip-groups")}
              className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Briefcase Icon */}
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Briefcase className="h-5 w-5" />
            </div>

            {/* Group Info */}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {tripGroup.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Trip
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                {tripGroup.description && <span>{tripGroup.description}</span>}
                {tripGroup.description && (tripGroup.startDate || tripGroup.endDate) && (
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                )}
                {(tripGroup.startDate || tripGroup.endDate) && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {tripGroup.startDate ? formatDateDisplay(tripGroup.startDate) : "—"}
                    {" → "}
                    {tripGroup.endDate ? formatDateDisplay(tripGroup.endDate) : "—"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Edit & Delete buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditError(null);
                setEditDialogOpen(true);
              }}
              className="gap-1.5 h-9 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium shadow-xs"
            >
              <Pencil className="h-3.5 w-3.5 text-slate-500" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-1.5 h-9 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 bg-rose-50/30 font-medium shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trip Spent */}
        <div className="rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/40 via-white to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-100/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              <Receipt className="h-3.5 w-3.5" /> Total Trip Spent
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {formatCurrency(totalExpense)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {tripGroup.transactions.length} {tripGroup.transactions.length === 1 ? "transaction" : "transactions"} recorded
          </p>
        </div>

        {/* Total Budget */}
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/40 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              <BarChart3 className="h-3.5 w-3.5" /> Total Budget
            </span>
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {formatCurrency(totalBudget)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Allocated across categories
          </p>
        </div>

        {/* Remaining */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/40 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Wallet className="h-3.5 w-3.5" /> Remaining
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              {totalRemaining >= 0 ? "Safe" : "Exceeded"}
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalRemaining)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {totalBudget > 0
              ? `${Math.max(0, Math.round(((totalBudget - totalExpense) / totalBudget) * 100))}% available to spend`
              : "No budget set"}
          </p>
        </div>

        {/* Utilization */}
        <div className="rounded-2xl border border-sky-100 dark:border-sky-900/40 bg-gradient-to-br from-sky-50/40 via-white to-white dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-100/80 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400">
              <TrendingUp className="h-3.5 w-3.5" /> Utilization
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {Math.round(budgetUtilization)}% / 100%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {Math.round(budgetUtilization)}%
            </span>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-md text-xs font-semibold border",
                budgetUtilization > 100
                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
                  : budgetUtilization >= 85
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
              )}
            >
              {budgetUtilization > 100 ? "Over Budget" : budgetUtilization >= 85 ? "Near Limit" : "On Track"}
            </span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                budgetUtilization > 100
                  ? "bg-rose-500"
                  : budgetUtilization >= 85
                  ? "bg-amber-500"
                  : "bg-teal-500"
              )}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Budget vs Actual Section */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Target className="h-4 w-4" />
            </div>
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">Budget vs Actual</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400">
              {Math.round(budgetUtilization)}% utilized
            </span>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">
              • Compare category allocations with current expenses
            </span>
          </div>
          <Button
            onClick={() => {
              setBudgetError(null);
              setSelectedBudgetCategory("");
              setBudgetDialogOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 shrink-0"
            disabled={availableBudgetCategories.length === 0}
          >
            <Plus className="h-4 w-4" /> Add Budget
          </Button>
        </div>

        {/* Budget Table */}
        {budgetVsActual.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">CATEGORY</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">BUDGET TARGET</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">ACTUAL SPENT</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">REMAINING</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-[140px]">% USED</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">STATUS</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {budgetVsActual.map((item) => {
                  const status = getBudgetStatus(item.budgeted, item.actual);
                  const initial = item.categoryName.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {initial}
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {item.categoryName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-bold text-sm text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.budgeted)}
                      </td>

                      <td className="py-3.5 px-5 font-bold text-sm text-rose-500 dark:text-rose-400">
                        {formatCurrency(item.actual)}
                      </td>

                      <td className="py-3.5 px-5 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.difference)}
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {Math.round(item.percentage)}%
                          </span>
                          <div className="w-28 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 font-semibold text-xs rounded-full px-3 py-0.5 inline-flex items-center",
                            status.badgeClass
                          )}
                        >
                          {status.icon}
                          <span>{status.label}</span>
                        </Badge>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          title="Remove budget"
                          onClick={() => {
                            const budget = tripGroup.budgets.find((b) => b.id === item.id);
                            if (budget) {
                              setDeletingBudget(budget);
                              setDeleteBudgetDialogOpen(true);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            <Target className="h-7 w-7 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-medium">No budgets set for this trip yet.</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Click &quot;Add Budget&quot; to set category spending targets.
            </p>
          </div>
        )}
      </div>

      {/* 4. Transactions Section */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Receipt className="h-4 w-4" />
            </div>
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">Transactions</h2>
            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center">
              {tripGroup.transactions.length}
            </span>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">
              • Itemized logs of all travel expenditures
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/transactions")}
            className="rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Transaction
          </Button>
        </div>

        {/* Transactions Table */}
        {tripGroup.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">DATE</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">TYPE</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">CATEGORY</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">AMOUNT</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">NOTES</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {tripGroup.transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-medium text-sm text-slate-900 dark:text-slate-100">
                      {formatDateDisplay(tx.date)}
                    </td>

                    <td className="py-3.5 px-5">
                      {tx.type === TransactionType.INCOME ? (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Income
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400">
                          Expense
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 font-medium text-sm text-slate-900 dark:text-slate-100">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        <span>{tx.category.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 font-bold text-sm text-rose-500 dark:text-rose-400">
                      {tx.type === TransactionType.INCOME ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </td>

                    <td className="py-3.5 px-5 text-sm text-slate-400 max-w-[200px] truncate">
                      {tx.notes || "—"}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setRemovingTx(tx);
                          setRemoveTxDialogOpen(true);
                        }}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Remove from group"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-medium">No transactions in this trip yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Select transactions from the Transactions page and add them to this group.
            </p>
          </div>
        )}
      </div>

      {/* 5. Spender Breakdown (if "Paid by: <name>" is present in transaction notes) */}
      {Object.keys(spenderBreakdown).length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-500" />
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">Spending by Person</h2>
              <Badge variant="secondary" className="text-[10px] ml-1">
                From &quot;Paid by:&quot; in notes
              </Badge>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Object.entries(spenderBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([name, amount]) => (
                <div key={name} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{name}</span>
                  </div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{formatCurrency(amount)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-violet-500" />
              Edit Trip Group
            </DialogTitle>
            <DialogDescription>Update the group details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4">
            {editError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
                {editError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name *</Label>
              <Input id="edit-name" name="name" defaultValue={tripGroup.name} required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Input id="edit-desc" name="description" defaultValue={tripGroup.description || ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-start">Start Date</Label>
                <Input
                  id="edit-start"
                  name="startDate"
                  type="date"
                  defaultValue={tripGroup.startDate ? formatDateForInput(tripGroup.startDate) : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end">End Date</Label>
                <Input
                  id="edit-end"
                  name="endDate"
                  type="date"
                  defaultValue={tripGroup.endDate ? formatDateForInput(tripGroup.endDate) : ""}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{tripGroup.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the group and unlink all {tripGroup.transactions.length} transactions. The transactions will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Transaction Dialog */}
      <AlertDialog open={removeTxDialogOpen} onOpenChange={setRemoveTxDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unlink the transaction ({removingTx ? formatCurrency(removingTx.amount) : ""} - {removingTx?.category.name}) from this group. The transaction itself will remain in your ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveTransaction} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Budget Dialog */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-500" />
              Add Category Budget
            </DialogTitle>
            <DialogDescription>
              Set a budget for a specific expense category within this trip group.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBudget} className="space-y-4">
            {budgetError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
                {budgetError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={selectedBudgetCategory} onValueChange={setSelectedBudgetCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableBudgetCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-amount">Budget Amount *</Label>
              <Input
                id="budget-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBudgetDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !selectedBudgetCategory} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Set Budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Budget Dialog */}
      <AlertDialog open={deleteBudgetDialogOpen} onOpenChange={setDeleteBudgetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Budget?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove the budget entry for &quot;{deletingBudget?.category.name}&quot; from this group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBudget} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remove Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
