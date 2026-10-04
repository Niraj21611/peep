"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Category, CategoryType, RecurrenceFrequency, TransactionType } from "@prisma/client";
import { createRecurringAction, updateRecurringAction } from "@/actions/recurring";
import { RecurringTransactionWithCategory, ActionResponse } from "@/types";
import { formatDateForInput } from "@/lib/utils";
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
import { Loader2, AlertCircle } from "lucide-react";

interface RecurringFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  rule?: RecurringTransactionWithCategory | null;
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
        "Save Rule Changes"
      ) : (
        "Create Recurring Rule"
      )}
    </Button>
  );
}

export function RecurringFormDialog({
  open,
  onOpenChange,
  categories,
  rule,
}: RecurringFormDialogProps) {
  const isEditing = !!rule;

  const initialState: ActionResponse = {
    success: false,
    message: "",
  };

  const actionFn = isEditing
    ? updateRecurringAction.bind(null, rule.id)
    : createRecurringAction;

  const [state, formAction] = useFormState(actionFn, initialState);

  const [type, setType] = useState<TransactionType>(
    rule?.type || TransactionType.EXPENSE
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    rule?.categoryId || ""
  );
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    rule?.frequency || RecurrenceFrequency.MONTHLY
  );

  const availableCategories = categories.filter(
    (cat) => cat.active && (cat.type === type || cat.type === CategoryType.BOTH)
  );

  useEffect(() => {
    if (rule) {
      setType(rule.type);
      setSelectedCategoryId(rule.categoryId);
      setFrequency(rule.frequency);
    } else {
      setType(TransactionType.EXPENSE);
      setFrequency(RecurrenceFrequency.MONTHLY);
      const matching = categories.filter(
        (cat) => cat.active && (cat.type === TransactionType.EXPENSE || cat.type === CategoryType.BOTH)
      );
      setSelectedCategoryId(matching[0]?.id || "");
    }
  }, [rule, open, categories]);

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

  const defaultStartStr = rule
    ? formatDateForInput(rule.startDate)
    : formatDateForInput(localTodayUTC);

  const defaultEndStr = rule?.endDate
    ? formatDateForInput(rule.endDate)
    : "";

  let customInterval = "14";
  if (rule?.recurrenceConfig) {
    try {
      const parsed = JSON.parse(rule.recurrenceConfig);
      if (parsed.intervalDays) customInterval = String(parsed.intervalDays);
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Recurring Rule" : "Create Recurring Rule"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update recurring transaction rule settings."
              : "Define a rule for repeating expenses or income (e.g. Daily Commute, Rent, Subscriptions)."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* Rule Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Daily Commute, House Rent, Netflix Subscription"
              defaultValue={rule?.name || ""}
              required
              maxLength={100}
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
                Expense Rule
              </Button>
              <Button
                type="button"
                variant={type === TransactionType.INCOME ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTypeChange(TransactionType.INCOME)}
                className={type === TransactionType.INCOME ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" : ""}
              >
                Income Rule
              </Button>
            </div>
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
                placeholder="77.00"
                defaultValue={rule?.amount || ""}
                required
              />
              {state.errors?.amount && (
                <p className="text-xs text-destructive">{state.errors.amount[0]}</p>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <input type="hidden" name="categoryId" value={selectedCategoryId} />
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.categoryId && (
                <p className="text-xs text-destructive">{state.errors.categoryId[0]}</p>
              )}
            </div>
          </div>

          {/* Frequency Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Recurrence Frequency</Label>
            <input type="hidden" name="frequency" value={frequency} />
            <Select value={frequency} onValueChange={(val) => setFrequency(val as RecurrenceFrequency)}>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RecurrenceFrequency.DAILY}>Daily (Every Day)</SelectItem>
                <SelectItem value={RecurrenceFrequency.WEEKDAYS}>Weekdays (Mon - Fri)</SelectItem>
                <SelectItem value={RecurrenceFrequency.WEEKLY}>Weekly (Every 7 Days)</SelectItem>
                <SelectItem value={RecurrenceFrequency.MONTHLY}>Monthly (Every Month)</SelectItem>
                <SelectItem value={RecurrenceFrequency.YEARLY}>Yearly (Every Year)</SelectItem>
                <SelectItem value={RecurrenceFrequency.CUSTOM}>Custom Interval</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Interval Option */}
          {frequency === RecurrenceFrequency.CUSTOM && (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
              <Label htmlFor="intervalDays">Repeat Every (Days)</Label>
              <Input
                id="intervalDays"
                name="intervalDays"
                type="number"
                min="1"
                max="365"
                defaultValue={customInterval}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={defaultStartStr}
                required
              />
              {state.errors?.startDate && (
                <p className="text-xs text-destructive">{state.errors.startDate[0]}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={defaultEndStr}
              />
              {state.errors?.endDate && (
                <p className="text-xs text-destructive">{state.errors.endDate[0]}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Description (Optional)</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="e.g. Daily auto-commute rule"
              defaultValue={rule?.notes || ""}
              maxLength={500}
            />
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
