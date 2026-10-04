"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { upsertBudgetAction } from "@/actions/budgets";
import { CalculatedCategoryBudget } from "@/lib/db/budgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActionResponse } from "@/types";
import { Loader2, AlertCircle } from "lucide-react";

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetMonth: string;
  categoryBudget: CalculatedCategoryBudget | null;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto min-w-[130px]">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEditing ? "Saving..." : "Setting..."}
        </>
      ) : isEditing ? (
        "Update Budget"
      ) : (
        "Set Budget"
      )}
    </Button>
  );
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  targetMonth,
  categoryBudget,
}: BudgetFormDialogProps) {
  const isEditing = !!categoryBudget?.budgetId;

  const initialState: ActionResponse = {
    success: false,
    message: "",
  };

  const [state, formAction] = useFormState(upsertBudgetAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  if (!categoryBudget) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Budget Target" : "Set Budget Target"}
          </DialogTitle>
          <DialogDescription>
            Configure monthly target budget for <strong>{categoryBudget.category.name}</strong> ({targetMonth}).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <input type="hidden" name="categoryId" value={categoryBudget.categoryId} />
          <input type="hidden" name="month" value={targetMonth} />

          <div className="space-y-2">
            <Label htmlFor="categoryName">Category</Label>
            <Input
              id="categoryName"
              value={categoryBudget.category.name}
              disabled
              className="bg-muted font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monthly Target Budget (₹)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              defaultValue={categoryBudget.budgetAmount || ""}
              required
              autoFocus
            />
            {state.errors?.amount && (
              <p className="text-xs text-destructive">{state.errors.amount[0]}</p>
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
