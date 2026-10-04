"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Category, CategoryType, TransactionType } from "@prisma/client";
import { createTransactionAction, updateTransactionAction } from "@/actions/transactions";
import { getUserTemplatesAction } from "@/actions/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActionResponse, TransactionWithCategory, TransactionTemplateWithCategory } from "@/types";
import { formatDateForInput, formatCurrency } from "@/lib/utils";
import { evaluateAmountChunks } from "@/lib/utils/math-eval";
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  X,
  BookmarkPlus,
  Check,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FolderTree,
  FileText,
  PlusCircle,
} from "lucide-react";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  transaction?: TransactionWithCategory | null;
  templates?: TransactionTemplateWithCategory[];
  initialTemplateId?: string | null;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto min-w-[140px] bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary/90 text-white font-semibold shadow-md shadow-slate-900/10 dark:shadow-primary/20 transition-all"
    >
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
  templates: initialTemplates,
  initialTemplateId,
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

  const [amountInput, setAmountInput] = useState<string>(
    transaction?.amountExpression || (transaction?.amount ? String(transaction.amount) : "")
  );

  const [notes, setNotes] = useState<string>(transaction?.notes || "");

  // Template feature states
  const [availableTemplates, setAvailableTemplates] = useState<TransactionTemplateWithCategory[]>(
    initialTemplates || []
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>("");

  const isTemplateApplied = !!selectedTemplateId;

  // Load user templates if not passed directly
  useEffect(() => {
    if (open && !initialTemplates) {
      getUserTemplatesAction().then((res) => {
        if (res.success && res.data) {
          setAvailableTemplates(res.data as TransactionTemplateWithCategory[]);
        }
      });
    } else if (initialTemplates) {
      setAvailableTemplates(initialTemplates);
    }
  }, [open, initialTemplates]);

  // Reset form when opening/closing or changing transaction
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setSelectedCategoryId(transaction.categoryId);
      setAmountInput(transaction.amountExpression || (transaction.amount ? String(transaction.amount) : ""));
      setNotes(transaction.notes || "");
    } else {
      setType(TransactionType.EXPENSE);
      const matching = categories.filter(
        (cat) => cat.active && (cat.type === TransactionType.EXPENSE || cat.type === CategoryType.BOTH)
      );
      setSelectedCategoryId(matching[0]?.id || "");
      setAmountInput("");
      setNotes("");
      setSelectedTemplateId("");
      setSaveAsTemplate(false);
      setTemplateName("");
    }
  }, [transaction, open, categories]);

  // Handle initial preset template selection if provided
  useEffect(() => {
    if (open && initialTemplateId && availableTemplates.length > 0) {
      const tmpl = availableTemplates.find((t) => t.id === initialTemplateId);
      if (tmpl) {
        applyTemplate(tmpl);
      }
    }
  }, [open, initialTemplateId, availableTemplates]);

  const applyTemplate = (tmpl: TransactionTemplateWithCategory) => {
    setSelectedTemplateId(tmpl.id);
    setType(tmpl.type);
    setSelectedCategoryId(tmpl.categoryId);
    setAmountInput(tmpl.amountExpression || String(tmpl.amount));
    if (tmpl.notes) {
      setNotes(tmpl.notes);
    }
    setSaveAsTemplate(false);
    setTemplateName("");
    toast.info(`Template "${tmpl.name}" applied`);
  };

  const clearTemplate = () => {
    setSelectedTemplateId("");
  };

  // Filter categories matching current transaction type
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

  // Live evaluation of amount chunks
  const evalResult = evaluateAmountChunks(amountInput);

  const localNow = new Date();
  const localTodayUTC = new Date(Date.UTC(localNow.getFullYear(), localNow.getMonth(), localNow.getDate()));

  const defaultDateStr = transaction
    ? formatDateForInput(transaction.date)
    : formatDateForInput(localTodayUTC);

  const selectedTemplateName = availableTemplates.find((t) => t.id === selectedTemplateId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto p-0 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl bg-white dark:bg-slate-950">
        {/* Styled Header with Gradient Accent */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 border-b border-slate-800">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-indigo-300 shadow-inner">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white tracking-tight">
                {isEditing ? "Edit Transaction" : "Record Transaction"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 mt-0.5">
                {isEditing
                  ? "Update your transaction details."
                  : "Add income or expense entry with live expression support."}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
          {/* Quick Templates Bar (Only for new transactions) */}
          {!isEditing && availableTemplates.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-200/60 dark:border-amber-900/50 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  Quick Templates
                </span>
                {isTemplateApplied && (
                  <button
                    type="button"
                    onClick={clearTemplate}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <X className="h-3 w-3" /> Clear selection
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableTemplates.map((tmpl) => {
                  const isActive = selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => applyTemplate(tmpl)}
                      className={`relative text-left p-2.5 rounded-lg border text-xs transition-all ${
                        isActive
                          ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20 shadow-xs font-medium"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5">
                          <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      )}
                      <span className="font-semibold block truncate pr-4">{tmpl.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                        {tmpl.amountExpression
                          ? `(${tmpl.amountExpression})`
                          : formatCurrency(tmpl.amount)}
                        {" · "}{tmpl.category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {state.message && !state.success && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            {/* Card Block 1: Type Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Transaction Type
              </Label>
              <input type="hidden" name="type" value={type} />
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTypeChange(TransactionType.EXPENSE)}
                  className={`h-9 font-semibold text-xs transition-all ${
                    type === TransactionType.EXPENSE
                      ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" /> Expense
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTypeChange(TransactionType.INCOME)}
                  className={`h-9 font-semibold text-xs transition-all ${
                    type === TransactionType.INCOME
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <ArrowDownLeft className="mr-1.5 h-3.5 w-3.5" /> Income
                </Button>
              </div>
              {state.errors?.type && (
                <p className="text-xs text-destructive">{state.errors.type[0]}</p>
              )}
            </div>

            {/* Card Block 2: Amount & Date (Aligned in single row) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="amountInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amount / Expression (₹)
                  </Label>
                  <Input
                    id="amountInput"
                    name="amountInput"
                    type="text"
                    placeholder="e.g. 5, 12 or 5+12-2"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                    className="h-10 text-sm font-medium border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20"
                  />
                  <input type="hidden" name="amountExpression" value={evalResult.hasExpression ? amountInput : ""} />

                  {amountInput.trim() !== "" && (
                    <div className="pt-0.5">
                      {evalResult.isValid && evalResult.value !== null ? (
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-emerald-500" />
                            Total:
                          </span>
                          <span>{formatCurrency(evalResult.value)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-rose-500 font-medium">
                          {evalResult.error || "Enter valid math expression"}
                        </span>
                      )}
                    </div>
                  )}

                  {state.errors?.amountInput && (
                    <p className="text-xs text-destructive">{state.errors.amountInput[0]}</p>
                  )}
                </div>

                {/* Date Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={defaultDateStr}
                    required
                    className="h-10 text-sm border-slate-200 dark:border-slate-800"
                  />
                  {state.errors?.date && (
                    <p className="text-xs text-destructive">{state.errors.date[0]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Card Block 3: Category & Notes */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="categoryId" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FolderTree className="h-3.5 w-3.5 text-slate-400" /> Category
                </Label>
                <input type="hidden" name="categoryId" value={selectedCategoryId} />
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger id="categoryId" className="h-10 text-sm border-slate-200 dark:border-slate-800">
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
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Notes (optional)
                </Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="e.g. Daily commute, Lunch, Monthly bill"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  className="h-10 text-sm border-slate-200 dark:border-slate-800"
                />
                {state.errors?.notes && (
                  <p className="text-xs text-destructive">{state.errors.notes[0]}</p>
                )}
              </div>
            </div>

            {/* Card Block 4: Save as Template (Only for new transactions) */}
            {!isEditing && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="saveAsTemplate"
                    checked={saveAsTemplate}
                    disabled={isTemplateApplied}
                    onCheckedChange={(checked) => {
                      setSaveAsTemplate(!!checked);
                      if (checked && !templateName) {
                        setTemplateName(notes || "");
                      }
                    }}
                  />
                  <input type="hidden" name="saveAsTemplate" value={saveAsTemplate ? "true" : "false"} />
                  <Label
                    htmlFor="saveAsTemplate"
                    className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                      isTemplateApplied ? "text-slate-400 dark:text-slate-500 cursor-not-allowed" : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    Save this transaction as a reusable template
                    {isTemplateApplied && (
                      <span className="text-[10px] text-slate-400 font-normal italic ml-1">
                        (using template "{selectedTemplateName}")
                      </span>
                    )}
                  </Label>
                </div>

                {saveAsTemplate && (
                  <div className="space-y-1.5 pl-6 pt-1">
                    <Label htmlFor="templateName" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Template Name
                    </Label>
                    <Input
                      id="templateName"
                      name="templateName"
                      placeholder="e.g. Daily Commute 77"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      required={saveAsTemplate}
                      className="h-9 text-xs border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 text-xs font-medium border-slate-300 dark:border-slate-700"
              >
                Cancel
              </Button>
              <SubmitButton isEditing={isEditing} />
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
