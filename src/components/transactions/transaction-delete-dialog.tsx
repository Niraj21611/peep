"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteTransactionAction } from "@/actions/transactions";
import { TransactionWithCategory } from "@/types";
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
import { Loader2, AlertTriangle } from "lucide-react";

interface TransactionDeleteDialogProps {
  transaction: TransactionWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDeleteDialog({
  transaction,
  open,
  onOpenChange,
}: TransactionDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!transaction) return null;

  const handleDelete = async () => {
    setLoading(true);

    const result = await deleteTransactionAction(transaction.id);
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
    } else {
      toast.error(result.message || "Failed to delete transaction.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Delete Transaction Entry?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 pt-1">
            <span>
              Are you sure you want to delete this transaction recorded on{" "}
              <strong>{formatDateDisplay(transaction.date)}</strong> for{" "}
              <strong>{formatCurrency(transaction.amount)}</strong> ({transaction.category.name})?
            </span>
            <span className="block text-xs text-muted-foreground font-medium pt-1">
              This action cannot be undone.
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
            Confirm Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
