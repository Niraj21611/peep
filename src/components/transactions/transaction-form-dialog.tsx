"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Category, CategoryType, TransactionType } from "@prisma/client";
import { createTransactionAction, updateTransactionAction } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActionResponse, TransactionWithCategory } from "@/types";
import { formatDateForInput } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  transaction?: TransactionWithCategory | null;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto min-w-[140px]">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEditing ? "Saving..." : "Recording..."}
        </>
      ) : isEditing ? (
        "Save Changes"
      ) : (
        "Add Transaction"
      )}
    </Button>
  );
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  transaction,
}: TransactionFormDialogProps) {
  const isEditing = !!transaction;

  const initialState: ActionResponse = {
    success: false,
    message: "",
  };

  const actionFn = isEditing
    ? updateTransactionAction.bind(null, transaction.id)
    : createTransactionAction;

  const [state, formAction] = useFormState(actionFn, initialState);

  const [type, setType] = useState<TransactionType>(
    transaction?.type || TransactionType.EXPENSE
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    transaction?.categoryId || ""
  );

  // Filter categories matching current transaction type
  const availableCategories = categories.filter(
    (cat) => cat.active && (cat.type === type || cat.type === CategoryType.BOTH)
  );

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setSelectedCategoryId(transaction.categoryId);
    } else {
      setType(TransactionType.EXPENSE);
      // Auto-select first matching category if available
      const matching = categories.filter(
        (cat) => cat.active && (cat.type === TransactionType.EXPENSE || cat.type === CategoryType.BOTH)
      );
      setSelectedCategoryId(matching[0]?.id || "");
    }
  }, [transaction, open, categories]);

  // Update selected category when type changes if current category is invalid for new type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const validCats = categories.filter(
      (cat) => cat.active && (cat.type === newType || cat.type === CategoryType.BOTH)
    );
    if (!validCats.some((cat) => cat.id === selectedCategoryId)) {
      setSelectedCategoryId(validCats[0]?.id || "");
    }
  };

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const localNow = new Date();
  const localTodayUTC = new Date(Date.UTC(localNow.getFullYear(), localNow.getMonth(), localNow.getDate()));

  const defaultDateStr = transaction
    ? formatDateForInput(transaction.date)
    : formatDateForInput(localTodayUTC);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Transaction" : "Record New Transaction"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update transaction details in your financial ledger."
              : "Log an income or expense transaction to update your cash flow records."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* Type Switcher */}
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <input type="hidden" name="type" value={type} />
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Button
                type="button"
                variant={type === TransactionType.EXPENSE ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTypeChange(TransactionType.EXPENSE)}
                className={type === TransactionType.EXPENSE ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm" : ""}
              >
                Expense
              </Button>
              <Button
                type="button"
                variant={type === TransactionType.INCOME ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTypeChange(TransactionType.INCOME)}
                className={type === TransactionType.INCOME ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" : ""}
              >
                Income
              </Button>
            </div>
            {state.errors?.type && (
              <p className="text-xs text-destructive">{state.errors.type[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                defaultValue={transaction?.amount || ""}
                required
              />
              {state.errors?.amount && (
                <p className="text-xs text-destructive">{state.errors.amount[0]}</p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={defaultDateStr}
                required
              />
              {state.errors?.date && (
                <p className="text-xs text-destructive">{state.errors.date[0]}</p>
              )}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <input type="hidden" name="categoryId" value={selectedCategoryId} />
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.length > 0 ? (
                  availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No active {type.toLowerCase()} categories found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {state.errors?.categoryId && (
              <p className="text-xs text-destructive">{state.errors.categoryId[0]}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Description (Optional)</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="e.g. Monthly grocery purchase, Client payment"
              defaultValue={transaction?.notes || ""}
              maxLength={500}
            />
            {state.errors?.notes && (
              <p className="text-xs text-destructive">{state.errors.notes[0]}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton isEditing={isEditing} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
