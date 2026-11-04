"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Category, TransactionType } from "@prisma/client";
import {
  TripGroupWithDetails,
  TransactionWithCategory,
  TripGroupBudgetWithCategory,
  TripGroupMemberWithExpenses,
  TripMemberExpenseWithDetails,
} from "@/types";
import { cn, formatCurrency, formatDateDisplay, formatDateForInput } from "@/lib/utils";
import {
  updateTripGroupAction,
  deleteTripGroupAction,
  removeTransactionFromTripGroupAction,
  upsertTripGroupBudgetAction,
  deleteTripGroupBudgetAction,
  addTripGroupMemberAction,
  deleteTripGroupMemberAction,
  createTripExpenseAction,
  updateTripMemberExpenseAction,
  deleteTripMemberExpenseAction,
} from "@/actions/trip-groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  User,
  UserPlus,
} from "lucide-react";

interface TripGroupDetailProps {
  tripGroup: TripGroupWithDetails;
  categories: Category[];
}

interface UnifiedExpense {
  id: string;
  source: "PERSONAL" | "MEMBER";
  date: Date;
  payerName: string;
  payerId: string; // "ME" or member.id
  isMe: boolean;
  categoryName: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  notes: string | null;
  rawTx?: TransactionWithCategory;
  rawMemberExpense?: TripMemberExpenseWithDetails;
}

export function TripGroupDetail({ tripGroup, categories }: TripGroupDetailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Basic trip dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Unlink personal transaction dialog
  const [removeTxDialogOpen, setRemoveTxDialogOpen] = useState(false);
  const [removingTx, setRemovingTx] = useState<TransactionWithCategory | null>(null);

  // Budget dialogs
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string>("");
  const [deleteBudgetDialogOpen, setDeleteBudgetDialogOpen] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<TripGroupBudgetWithCategory | null>(null);

  // Member Management dialogs
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<TripGroupMemberWithExpenses | null>(null);

  // Expense Management dialogs (Unified Add, Member Edit/Delete)
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [addExpenseError, setAddExpenseError] = useState<string | null>(null);
  const [expensePayer, setExpensePayer] = useState<string>("ME");
  const [expenseCategory, setExpenseCategory] = useState<string>("");

  const [editMemberExpenseDialogOpen, setEditMemberExpenseDialogOpen] = useState(false);
  const [editingMemberExpense, setEditingMemberExpense] = useState<TripMemberExpenseWithDetails | null>(null);
  const [editExpenseError, setEditExpenseError] = useState<string | null>(null);
  const [editExpensePayer, setEditExpensePayer] = useState<string>("");
  const [editExpenseCategory, setEditExpenseCategory] = useState<string>("");

  const [deleteMemberExpenseDialogOpen, setDeleteMemberExpenseDialogOpen] = useState(false);
  const [deletingMemberExpense, setDeletingMemberExpense] = useState<TripMemberExpenseWithDetails | null>(null);

  // Filter state for transactions list: "ALL" | "ME" | memberId
  const [txFilter, setTxFilter] = useState<string>("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Calculations & Aggregations ---
  const members = tripGroup.members || [];
  const memberExpenses = tripGroup.memberExpenses || [];

  let myTotalExpense = 0;
  let myTotalIncome = 0;
  const expenseByCategory: Record<string, { name: string; amount: number }> = {};
  const spenderTotals: Record<string, { name: string; amount: number; isMe: boolean }> = {};

  // 1. My Personal Ledger Transactions linked to this group
  for (const tx of tripGroup.transactions) {
    if (tx.type === TransactionType.EXPENSE) {
      myTotalExpense += tx.amount;
      const existing = expenseByCategory[tx.categoryId];
      if (existing) {
        existing.amount += tx.amount;
      } else {
        expenseByCategory[tx.categoryId] = { name: tx.category.name, amount: tx.amount };
      }
    } else if (tx.type === TransactionType.INCOME) {
      myTotalIncome += tx.amount;
    }
  }

  spenderTotals["ME"] = {
    name: "You (Trip Organizer)",
    amount: myTotalExpense,
    isMe: true,
  };

  // 2. Member Expenses (added specifically for this trip, isolated from personal ledger)
  let membersTotalExpense = 0;
  for (const me of memberExpenses) {
    membersTotalExpense += me.amount;

    const existing = expenseByCategory[me.categoryId];
    if (existing) {
      existing.amount += me.amount;
    } else {
      expenseByCategory[me.categoryId] = { name: me.category.name, amount: me.amount };
    }

    const existingSpender = spenderTotals[me.memberId];
    if (!existingSpender) {
      spenderTotals[me.memberId] = {
        name: me.member.name,
        amount: me.amount,
        isMe: false,
      };
    } else {
      existingSpender.amount += me.amount;
    }
  }

  // Ensure all members appear in breakdown even if they haven't spent yet
  for (const m of members) {
    if (!spenderTotals[m.id]) {
      spenderTotals[m.id] = {
        name: m.name,
        amount: 0,
        isMe: false,
      };
    }
  }

  // Combined totals
  const totalCombinedExpense = myTotalExpense + membersTotalExpense;
  const totalTransactionsCount = tripGroup.transactions.length + memberExpenses.length;

  const totalBudget = tripGroup.budgets.reduce((sum, b) => sum + b.amount, 0);
  const budgetUtilization = totalBudget > 0 ? (totalCombinedExpense / totalBudget) * 100 : 0;
  const totalRemaining = totalBudget - totalCombinedExpense;

  // Build budget vs actual comparing combined spending per category
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

  const budgetedCategoryIds = new Set(tripGroup.budgets.map((b) => b.categoryId));
  const availableBudgetCategories = categories.filter(
    (c) => !budgetedCategoryIds.has(c.id) && (c.type === "EXPENSE" || c.type === "BOTH")
  );

  const expenseCategories = categories.filter(
    (c) => c.type === "EXPENSE" || c.type === "BOTH"
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

  // Build Unified Expenses list
  const unifiedExpenses: UnifiedExpense[] = [
    ...tripGroup.transactions.map((tx) => ({
      id: tx.id,
      source: "PERSONAL" as const,
      date: new Date(tx.date),
      payerName: "You",
      payerId: "ME",
      isMe: true,
      categoryName: tx.category.name,
      categoryId: tx.categoryId,
      amount: tx.amount,
      type: tx.type,
      notes: tx.notes,
      rawTx: tx,
    })),
    ...memberExpenses.map((me) => ({
      id: me.id,
      source: "MEMBER" as const,
      date: new Date(me.date),
      payerName: me.member.name,
      payerId: me.memberId,
      isMe: false,
      categoryName: me.category.name,
      categoryId: me.categoryId,
      amount: me.amount,
      type: TransactionType.EXPENSE,
      notes: me.notes,
      rawMemberExpense: me,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredExpenses = unifiedExpenses.filter((e) => {
    if (txFilter === "ALL") return true;
    if (txFilter === "ME") return e.isMe;
    return e.payerId === txFilter;
  });

  // --- Action Handlers ---
  const handleEditTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEditError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateTripGroupAction(tripGroup.id, formData);

    if (result.success) {
      setEditDialogOpen(false);
      toast.success(result.message);
      startTransition(() => router.refresh());
    } else {
      setEditError(result.message || "Failed to update.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteTrip = async () => {
    setIsSubmitting(true);
    const result = await deleteTripGroupAction(tripGroup.id);
    if (result.success) {
      toast.success(result.message);
      router.push("/trip-groups");
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const handleRemovePersonalTransaction = async () => {
    if (!removingTx) return;
    setIsSubmitting(true);

    const result = await removeTransactionFromTripGroupAction(removingTx.id);
    if (result.success) {
      toast.success(result.message);
      setRemoveTxDialogOpen(false);
      setRemovingTx(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.message);
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
      toast.success(result.message);
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
      toast.success(result.message);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAddMemberError(null);

    const formData = new FormData(e.currentTarget);
    const result = await addTripGroupMemberAction(tripGroup.id, formData);

    if (result.success) {
      setAddMemberDialogOpen(false);
      toast.success(result.message);
      startTransition(() => router.refresh());
    } else {
      setAddMemberError(result.message || "Failed to add member.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setIsSubmitting(true);

    const result = await deleteTripGroupMemberAction(deletingMember.id, tripGroup.id);
    if (result.success) {
      setDeleteMemberDialogOpen(false);
      setDeletingMember(null);
      toast.success(result.message);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAddExpenseError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("payer", expensePayer);
    formData.set("categoryId", expenseCategory);

    const result = await createTripExpenseAction(tripGroup.id, formData);

    if (result.success) {
      setAddExpenseDialogOpen(false);
      setExpenseCategory("");
      toast.success(result.message);
      startTransition(() => router.refresh());
    } else {
      setAddExpenseError(result.message || "Failed to record expense.");
    }
    setIsSubmitting(false);
  };

  const handleOpenEditMemberExpense = (item: TripMemberExpenseWithDetails) => {
    setEditingMemberExpense(item);
    setEditExpensePayer(item.memberId);
    setEditExpenseCategory(item.categoryId);
    setEditExpenseError(null);
    setEditMemberExpenseDialogOpen(true);
  };

  const handleUpdateMemberExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMemberExpense) return;
    setIsSubmitting(true);
    setEditExpenseError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("memberId", editExpensePayer);
    formData.set("categoryId", editExpenseCategory);

    const result = await updateTripMemberExpenseAction(
      editingMemberExpense.id,
      tripGroup.id,
      formData
    );

    if (result.success) {
      setEditMemberExpenseDialogOpen(false);
      setEditingMemberExpense(null);
      toast.success(result.message);
      startTransition(() => router.refresh());
    } else {
      setEditExpenseError(result.message || "Failed to update expense.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteMemberExpense = async () => {
    if (!deletingMemberExpense) return;
    setIsSubmitting(true);

    const result = await deleteTripMemberExpenseAction(
      deletingMemberExpense.id,
      tripGroup.id
    );

    if (result.success) {
      setDeleteMemberExpenseDialogOpen(false);
      setDeletingMemberExpense(null);
      toast.success(result.message);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const todayStr = formatDateForInput(new Date());

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/trip-groups")}
              className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Briefcase className="h-5 w-5" />
            </div>

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

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={() => {
                setAddExpenseError(null);
                setExpensePayer("ME");
                setExpenseCategory(expenseCategories[0]?.id || "");
                setAddExpenseDialogOpen(true);
              }}
              className="gap-1.5 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add Expense
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddMemberError(null);
                setAddMemberDialogOpen(true);
              }}
              className="gap-1.5 h-9 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Add Member
            </Button>

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

      {/* 2. Top Metric KPI Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trip Spent (Combined) */}
        <div className="rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/40 via-white to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-100/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              <Receipt className="h-3.5 w-3.5" /> Total Trip Spent
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>

          <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {formatCurrency(totalCombinedExpense)}
          </div>

          {/* User's portion clearly distinguished below total */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              My spending: {formatCurrency(myTotalExpense)}
            </span>
            {membersTotalExpense > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                Members: {formatCurrency(membersTotalExpense)}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {totalTransactionsCount} {totalTransactionsCount === 1 ? "transaction" : "transactions"} combined
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
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Allocated across {tripGroup.budgets.length} categories
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
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {totalBudget > 0
              ? `${Math.max(0, Math.round(((totalBudget - totalCombinedExpense) / totalBudget) * 100))}% available`
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

      {/* 3. Trip Members / Companions Section */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">Trip Members & Companions</h2>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {members.length + 1} People
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Manage members and record expenses paid by each person without mixing into your personal ledger
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setAddMemberError(null);
              setAddMemberDialogOpen(true);
            }}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm px-3.5 py-2 flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <UserPlus className="h-4 w-4" /> Add Member
          </Button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* 1. Trip Organizer (You) Card */}
            <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    YOU
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">You</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      Trip Organizer
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-indigo-100/60 dark:border-indigo-900/30 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Total Spent:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {formatCurrency(myTotalExpense)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddExpenseError(null);
                  setExpensePayer("ME");
                  setExpenseCategory(expenseCategories[0]?.id || "");
                  setAddExpenseDialogOpen(true);
                }}
                className="w-full text-xs h-8 rounded-lg border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add My Expense
              </Button>
            </div>

            {/* 2. Added Members Cards */}
            {members.map((m) => {
              const mExpenses = memberExpenses.filter((e) => e.memberId === m.id);
              const mTotal = mExpenses.reduce((sum, e) => sum + e.amount, 0);

              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold shadow-xs">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{m.name}</h4>
                        {m.email ? (
                          <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">{m.email}</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Trip Member</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingMember(m);
                        setDeleteMemberDialogOpen(true);
                      }}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      title={`Remove ${m.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Spent ({mExpenses.length} {mExpenses.length === 1 ? "expense" : "expenses"}):
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(mTotal)}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAddExpenseError(null);
                      setExpensePayer(m.id);
                      setExpenseCategory(expenseCategories[0]?.id || "");
                      setAddExpenseDialogOpen(true);
                    }}
                    className="w-full text-xs h-8 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Expense for {m.name}
                  </Button>
                </div>
              );
            })}
          </div>

          {members.length === 0 && (
            <div className="mt-2 p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Traveling with friends? Click <strong>&quot;Add Member&quot;</strong> above to log transactions made by other users and view combined trip expenditures.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Budget vs Actual Section */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
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
              • Compares combined category spending targets against all recorded expenses
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

      {/* 5. Trip Transactions Section (Unified) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Receipt className="h-4 w-4" />
            </div>
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">Trip Expenses & Ledger</h2>
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center">
              {unifiedExpenses.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
              <button
                onClick={() => setTxFilter("ALL")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  txFilter === "ALL"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                All ({unifiedExpenses.length})
              </button>
              <button
                onClick={() => setTxFilter("ME")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  txFilter === "ME"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                You ({tripGroup.transactions.length})
              </button>
              {members.map((m) => {
                const count = memberExpenses.filter((e) => e.memberId === m.id).length;
                return (
                  <button
                    key={m.id}
                    onClick={() => setTxFilter(m.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors",
                      txFilter === m.id
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {m.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Add Expense Button */}
            <Button
              size="sm"
              onClick={() => {
                setAddExpenseError(null);
                setExpensePayer(txFilter !== "ALL" ? txFilter : "ME");
                setExpenseCategory(expenseCategories[0]?.id || "");
                setAddExpenseDialogOpen(true);
              }}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm px-3.5 py-1.5 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>
        </div>

        {/* Unified Table */}
        {filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">DATE</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">PAID BY</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">CATEGORY</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">AMOUNT</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">NOTES</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredExpenses.map((item) => (
                  <tr
                    key={`${item.source}-${item.id}`}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-medium text-sm text-slate-900 dark:text-slate-100">
                      {formatDateDisplay(item.date)}
                    </td>

                    {/* Paid By Column with Distinct Badges */}
                    <td className="py-3.5 px-5">
                      {item.isMe ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-400">
                          <User className="h-3 w-3" /> You (Mine)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-400">
                          <Users className="h-3 w-3" /> {item.payerName}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 font-medium text-sm text-slate-900 dark:text-slate-100">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        <span>{item.categoryName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 font-bold text-sm text-rose-500 dark:text-rose-400">
                      {item.type === TransactionType.INCOME ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </td>

                    <td className="py-3.5 px-5 text-sm text-slate-400 max-w-[200px] truncate">
                      {item.notes || "—"}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.source === "MEMBER" && item.rawMemberExpense ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditMemberExpense(item.rawMemberExpense!)}
                              className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              title="Edit expense"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingMemberExpense(item.rawMemberExpense!);
                                setDeleteMemberExpenseDialogOpen(true);
                              }}
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                              title="Delete expense"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (item.rawTx) {
                                setRemovingTx(item.rawTx);
                                setRemoveTxDialogOpen(true);
                              }
                            }}
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                            title="Unlink from trip group"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
            <Receipt className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-medium">No transactions match this filter.</p>
            <p className="text-xs text-slate-400">
              Click &quot;Add Expense&quot; above to log an expense for yourself or a member.
            </p>
          </div>
        )}
      </div>

      {/* 6. Spender Breakdown Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">Spending by Person</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Combined Total: {formatCurrency(totalCombinedExpense)}
          </span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Object.entries(spenderTotals)
            .sort(([, a], [, b]) => b.amount - a.amount)
            .map(([key, item]) => {
              const percent = totalCombinedExpense > 0 ? Math.round((item.amount / totalCombinedExpense) * 100) : 0;

              return (
                <div
                  key={key}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-xs",
                        item.isMe
                          ? "bg-indigo-600 text-white"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                      )}
                    >
                      {item.isMe ? "YOU" : item.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {item.name}
                        </span>
                        {item.isMe && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", item.isMe ? "bg-indigo-600" : "bg-purple-600")}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">{percent}% of total</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* --- Dialogs --- */}

      {/* 1. Add Expense Dialog (for You or any member) */}
      <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              Add Trip Expense
            </DialogTitle>
            <DialogDescription>
              Record an expense paid for this trip by you or another member. Member expenses are kept separate from your personal ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddExpense} className="space-y-4 pt-1">
            {addExpenseError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
                {addExpenseError}
              </div>
            )}

            <div className="space-y-2">
              <Label>Who Paid? *</Label>
              <Select value={expensePayer} onValueChange={setExpensePayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ME">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">You (Trip Organizer)</span>
                  </SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} (Member)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {expensePayer !== "ME" && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  This will be tracked as a trip contribution by {members.find((m) => m.id === expensePayer)?.name} and won&apos;t affect your personal account balance.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount (₹) *</Label>
                <Input
                  id="expense-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-date">Date *</Label>
                <Input
                  id="expense-date"
                  name="date"
                  type="date"
                  defaultValue={todayStr}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-notes">Notes / Description</Label>
              <Input
                id="expense-notes"
                name="notes"
                placeholder="e.g., Dinner at hotel, Flight tickets, Taxi"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddExpenseDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !expenseCategory}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Record Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              Add Trip Member
            </DialogTitle>
            <DialogDescription>
              Add a companion or friend to this trip so you can log the expenses they paid.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="space-y-4 pt-1">
            {addMemberError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
                {addMemberError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="member-name">Member Name *</Label>
              <Input
                id="member-name"
                name="name"
                placeholder="e.g., Rahul, Priya, Alex"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-email">Email (Optional)</Label>
              <Input
                id="member-email"
                name="email"
                type="email"
                placeholder="companion@example.com"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Delete Member Dialog */}
      <AlertDialog open={deleteMemberDialogOpen} onOpenChange={setDeleteMemberDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deletingMember?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deletingMember?.name}</strong> and all expenses logged under their name from this trip. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 4. Edit Member Expense Dialog */}
      <Dialog open={editMemberExpenseDialogOpen} onOpenChange={setEditMemberExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-indigo-600" />
              Edit Member Expense
            </DialogTitle>
            <DialogDescription>Update the details of this member expense.</DialogDescription>
          </DialogHeader>

          {editingMemberExpense && (
            <form onSubmit={handleUpdateMemberExpense} className="space-y-4 pt-1">
              {editExpenseError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
                  {editExpenseError}
                </div>
              )}

              <div className="space-y-2">
                <Label>Member *</Label>
                <Select value={editExpensePayer} onValueChange={setEditExpensePayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={editExpenseCategory} onValueChange={setEditExpenseCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Amount (₹) *</Label>
                  <Input
                    id="edit-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={editingMemberExpense.amount}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    name="date"
                    type="date"
                    defaultValue={formatDateForInput(new Date(editingMemberExpense.date))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes / Description</Label>
                <Input
                  id="edit-notes"
                  name="notes"
                  defaultValue={editingMemberExpense.notes || ""}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditMemberExpenseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 5. Delete Member Expense Dialog */}
      <AlertDialog open={deleteMemberExpenseDialogOpen} onOpenChange={setDeleteMemberExpenseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense of{" "}
              <strong>{deletingMemberExpense ? formatCurrency(deletingMemberExpense.amount) : ""}</strong> paid by{" "}
              <strong>{deletingMemberExpense?.member.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMemberExpense}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Expense
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 6. Edit Trip Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-indigo-600" />
              Edit Trip Group
            </DialogTitle>
            <DialogDescription>Update the group details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditTrip} className="space-y-4">
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

      {/* 7. Delete Group Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{tripGroup.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the group. Personal transactions will remain in your ledger (unlinked), but member records and member expenses for this trip will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrip} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 8. Remove Personal Transaction Dialog */}
      <AlertDialog open={removeTxDialogOpen} onOpenChange={setRemoveTxDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Transaction from Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unlink the transaction ({removingTx ? formatCurrency(removingTx.amount) : ""} - {removingTx?.category.name}) from this group. The transaction itself will safely remain in your personal ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePersonalTransaction} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 9. Add Budget Dialog */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
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

      {/* 10. Delete Budget Dialog */}
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
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remove Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
