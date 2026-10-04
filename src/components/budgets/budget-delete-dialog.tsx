"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteBudgetAction } from "@/actions/budgets";
import { CalculatedCategoryBudget } from "@/lib/db/budgets";
import { formatCurrency } from "@/lib/utils";
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
import { Loader2, AlertTriangle } from "lucide-react";

interface BudgetDeleteDialogProps {
  categoryBudget: CalculatedCategoryBudget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetDeleteDialog({
  categoryBudget,
  open,
  onOpenChange,
}: BudgetDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!categoryBudget || !categoryBudget.budgetId) return null;

  const handleDelete = async () => {
    setLoading(true);

    const result = await deleteBudgetAction(categoryBudget.budgetId!);
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
    } else {
      toast.error(result.message || "Failed to remove budget.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Remove Budget Target?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 pt-1">
            <span>
              Are you sure you want to remove the target budget of{" "}
              <strong>{formatCurrency(categoryBudget.budgetAmount)}</strong> set for{" "}
              <strong>{categoryBudget.category.name}</strong> ({categoryBudget.month})?
            </span>
            <span className="block text-xs text-muted-foreground font-medium pt-1">
              Actual transaction records will remain unaffected.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
