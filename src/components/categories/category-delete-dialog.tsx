"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Category } from "@prisma/client";
import { deleteCategoryAction, getCategoryTransactionsAction } from "@/actions/categories";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, ExternalLink } from "lucide-react";

interface CategoryWithCount extends Category {
  _count?: {
    transactions: number;
    budgets: number;
    recurringTransactions: number;
  };
}

interface LinkedTransaction {
  id: string;
  date: Date;
  type: string;
  amount: number;
  notes: string | null;
}

interface CategoryDeleteDialogProps {
  category: CategoryWithCount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryDeleteDialog({
  category,
  open,
  onOpenChange,
}: CategoryDeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingTxns, setFetchingTxns] = useState(false);
  const [transactions, setTransactions] = useState<LinkedTransaction[]>([]);
  const [hasTransactions, setHasTransactions] = useState(false);

  useEffect(() => {
    if (!open || !category) {
      setTransactions([]);
      setHasTransactions(false);
      return;
    }

    const txnCount = category._count?.transactions ?? 0;
    if (txnCount > 0) {
      setHasTransactions(true);
      setFetchingTxns(true);
      getCategoryTransactionsAction(category.id)
        .then((res) => {
          if (res.success && res.data) {
            setTransactions(res.data as LinkedTransaction[]);
          }
        })
        .finally(() => {
          setFetchingTxns(false);
        });
    } else {
      setHasTransactions(false);
    }
  }, [category, open]);

  if (!category) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteCategoryAction(category.id);
      if (result.success) {
        toast.success(result.message || "Category deleted successfully.");
        onOpenChange(false);
      } else {
        if (result.data?.transactions && result.data.transactions.length > 0) {
          setHasTransactions(true);
          setTransactions(result.data.transactions as LinkedTransaction[]);
        }
        toast.error(result.message || "Failed to delete category.");
      }
    } catch {
      toast.error("An error occurred while deleting category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-full ${
                hasTransactions
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl">
                {hasTransactions
                  ? `Cannot Delete "${category.name}"`
                  : `Delete Category "${category.name}"`}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm mt-1">
                {hasTransactions
                  ? `This category is linked to ${transactions.length || category._count?.transactions} existing transaction(s). You must reassign or delete these transactions before deleting the category.`
                  : `Are you sure you want to permanently delete "${category.name}"? This action cannot be undone.`}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {hasTransactions && (
          <div className="my-4 flex-1 overflow-hidden flex flex-col border rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Linked Transactions ({transactions.length})</span>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1">
                <Link href="/transactions" onClick={() => onOpenChange(false)}>
                  Go to Transactions <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[300px] p-2 space-y-2">
              {fetchingTxns ? (
                <div className="flex justify-center items-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  Transactions exist for this category.
                </p>
              ) : (
                transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="p-3 bg-background rounded-md border flex items-center justify-between text-sm shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatDateDisplay(txn.date)}
                        </span>
                        <Badge
                          variant={txn.type === "INCOME" ? "default" : "destructive"}
                          className="text-[10px] px-1.5 py-0 font-semibold"
                        >
                          {txn.type}
                        </Badge>
                      </div>
                      {txn.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {txn.notes}
                        </p>
                      )}
                    </div>
                    <span
                      className={`font-semibold ${
                        txn.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {txn.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(txn.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={loading}>
            {hasTransactions ? "Close" : "Cancel"}
          </AlertDialogCancel>

          {!hasTransactions && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Category
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
