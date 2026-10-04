"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Category, CategoryType, TransactionType } from "@prisma/client";
import { createTemplateAction, updateTemplateAction } from "@/actions/templates";
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
import { ActionResponse, TransactionTemplateWithCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { evaluateAmountChunks } from "@/lib/utils/math-eval";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  template?: TransactionTemplateWithCategory | null;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto min-w-[140px]">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEditing ? "Saving..." : "Creating..."}
        </>
      ) : isEditing ? (
        "Save Changes"
      ) : (
        "Create Template"
      )}
    </Button>
  );
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  categories,
  template,
}: TemplateFormDialogProps) {
  const isEditing = !!template;

  const initialState: ActionResponse = {
    success: false,
    message: "",
  };

  const actionFn = isEditing
    ? updateTemplateAction.bind(null, template.id)
    : createTemplateAction;

  const [state, formAction] = useFormState(actionFn, initialState);

  const [name, setName] = useState<string>(template?.name || "");
  const [type, setType] = useState<TransactionType>(
    template?.type || TransactionType.EXPENSE
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    template?.categoryId || ""
  );
  const [amountInput, setAmountInput] = useState<string>(
    template?.amountExpression || (template?.amount ? String(template.amount) : "")
  );
  const [notes, setNotes] = useState<string>(template?.notes || "");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setType(template.type);
      setSelectedCategoryId(template.categoryId);
      setAmountInput(template.amountExpression || (template.amount ? String(template.amount) : ""));
      setNotes(template.notes || "");
    } else {
      setName("");
      setType(TransactionType.EXPENSE);
      const matching = categories.filter(
        (cat) => cat.active && (cat.type === TransactionType.EXPENSE || cat.type === CategoryType.BOTH)
      );
      setSelectedCategoryId(matching[0]?.id || "");
      setAmountInput("");
      setNotes("");
    }
  }, [template, open, categories]);

  const availableCategories = categories.filter(
    (cat) => cat.active && (cat.type === type || cat.type === CategoryType.BOTH)
  );

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

  const evalResult = evaluateAmountChunks(amountInput);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Template" : "Create Transaction Template"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update saved transaction template details."
              : "Save fixed or frequent transactions with pre-configured amount chunks."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Daily Commute, Morning Coffee, Rent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {state.errors?.name && (
              <p className="text-xs text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

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

          {/* Amount / Chunks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amountInput">Amount / Chunks (₹)</Label>
              {evalResult.hasExpression && evalResult.isValid && evalResult.value !== null && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Sum = {formatCurrency(evalResult.value)}
                </span>
              )}
            </div>

            <Input
              id="amountInput"
              name="amountInput"
              type="text"
              placeholder="e.g. 77 or 5, 12 or 5 + 12 - 2"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
            />

            <input type="hidden" name="amountExpression" value={evalResult.hasExpression ? amountInput : ""} />

            {amountInput.trim() !== "" && (
              <div className="text-[11px] text-muted-foreground">
                {evalResult.isValid && evalResult.value !== null ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Evaluated Amount: <strong>{formatCurrency(evalResult.value)}</strong>
                    {evalResult.hasExpression && ` (Expression: ${amountInput})`}
                  </span>
                ) : (
                  <span className="text-rose-500">{evalResult.error || "Enter valid number or expression e.g. 5, 12"}</span>
                )}
              </div>
            )}

            {state.errors?.amountInput && (
              <p className="text-xs text-destructive">{state.errors.amountInput[0]}</p>
            )}
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
              placeholder="e.g. Daily commute, Metro card refill"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
