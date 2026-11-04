"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Category, TransactionType } from "@prisma/client";
import { TripGroupWithDetails } from "@/types";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { createTripGroupAction, deleteTripGroupAction } from "@/actions/trip-groups";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Briefcase,
  Trash2,
  ArrowRight,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Calendar,
  Loader2,
  MapPin,
} from "lucide-react";

interface TripGroupListProps {
  tripGroups: TripGroupWithDetails[];
  categories: Category[];
}

export function TripGroupList({ tripGroups }: TripGroupListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<TripGroupWithDetails | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createTripGroupAction(formData);

    if (result.success) {
      setCreateDialogOpen(false);
      startTransition(() => router.refresh());
    } else {
      setFormError(result.message || "Failed to create trip group.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    setIsSubmitting(true);

    const result = await deleteTripGroupAction(deletingGroup.id);

    if (result.success) {
      setDeleteDialogOpen(false);
      setDeletingGroup(null);
      startTransition(() => router.refresh());
    }
    setIsSubmitting(false);
  };

  const getGroupStats = (group: TripGroupWithDetails) => {
    let totalIncome = 0;
    let myExpense = 0;

    for (const tx of group.transactions) {
      if (tx.type === TransactionType.INCOME) {
        totalIncome += tx.amount;
      } else {
        myExpense += tx.amount;
      }
    }

    const memberExpenseTotal =
      group.memberExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const totalExpense = myExpense + memberExpenseTotal;
    const totalBudget = group.budgets.reduce((sum, b) => sum + b.amount, 0);
    const transactionCount =
      group.transactions.length + (group.memberExpenses?.length || 0);
    const memberCount = group.members?.length || 0;

    return {
      totalIncome,
      totalExpense,
      myExpense,
      memberExpenseTotal,
      totalBudget,
      transactionCount,
      memberCount,
    };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Groups"
        description="Group transactions by trips, events, or projects. Track spending and budgets for each group."
      >
        <Button
          onClick={() => { setFormError(null); setCreateDialogOpen(true); }}
          className="gap-2 shrink-0 shadow-xs"
        >
          <Plus className="h-4 w-4" /> New Group
        </Button>
      </PageHeader>

      {/* Trip Group Cards Grid */}
      {tripGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {tripGroups.map((group) => {
            const stats = getGroupStats(group);
            const budgetUtilization = stats.totalBudget > 0
              ? Math.round((stats.totalExpense / stats.totalBudget) * 100)
              : 0;

            return (
              <Card
                key={group.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/trip-groups/${group.id}`)}
              >
                {/* Top colored accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 shrink-0">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate text-base">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{group.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingGroup(group);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
                    </div>
                  </div>

                  {/* Date Range */}
                  {(group.startDate || group.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {group.startDate ? formatDateDisplay(group.startDate) : "—"}
                        {" → "}
                        {group.endDate ? formatDateDisplay(group.endDate) : "—"}
                      </span>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 p-2.5 border border-emerald-100 dark:border-emerald-500/10">
                      <div className="flex items-center gap-1 mb-1">
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Income</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(stats.totalIncome)}</p>
                    </div>
                    <div className="rounded-lg bg-rose-50/50 dark:bg-rose-500/5 p-2.5 border border-rose-100 dark:border-rose-500/10">
                      <div className="flex items-center gap-1 mb-1">
                        <ArrowDownLeft className="h-3 w-3 text-rose-500" />
                        <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Expense</span>
                      </div>
                      <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{formatCurrency(stats.totalExpense)}</p>
                      {stats.memberExpenseTotal > 0 && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          Mine: {formatCurrency(stats.myExpense)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">
                        {stats.memberCount > 0 ? `${stats.memberCount + 1} people • ` : ""}
                        {stats.transactionCount} transactions
                      </span>
                    </div>
                    {stats.totalBudget > 0 && (
                      <Badge
                        variant={budgetUtilization > 100 ? "destructive" : "secondary"}
                        className="text-[10px] px-2 py-0.5"
                      >
                        <Wallet className="h-3 w-3 mr-1" />
                        {budgetUtilization}% of budget
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto p-4 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-500 w-fit">
              <MapPin className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">No trip groups yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Create your first trip group to start organizing and tracking spending for trips, events, or projects.
              </p>
            </div>
            <Button
              onClick={() => { setFormError(null); setCreateDialogOpen(true); }}
              className="gap-2 mt-2"
            >
              <Plus className="h-4 w-4" /> Create Trip Group
            </Button>
          </div>
        </Card>
      )}

      {/* Create Trip Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-violet-500" />
              Create Trip Group
            </DialogTitle>
            <DialogDescription>
              Create a new group to organize and track transactions for a trip, event, or project.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="trip-name">Group Name *</Label>
              <Input
                id="trip-name"
                name="name"
                placeholder="e.g., Goa Trip 2026"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trip-description">Description</Label>
              <Input
                id="trip-description"
                name="description"
                placeholder="e.g., Family vacation to Goa"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="trip-start-date">Start Date</Label>
                <Input
                  id="trip-start-date"
                  name="startDate"
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-end-date">End Date</Label>
                <Input
                  id="trip-end-date"
                  name="endDate"
                  type="date"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the group <strong>&quot;{deletingGroup?.name}&quot;</strong> and unlink all{" "}
              {deletingGroup?.transactions.length || 0} transactions from it. The transactions themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
