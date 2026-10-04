"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Category, RecurrenceFrequency, TransactionType } from "@prisma/client";
import { RecurringTransactionWithCategory } from "@/types";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { getNextOccurrenceDate } from "@/lib/finance/recurring-engine";
import { toggleRecurringStatusAction, triggerGenerateDueAction } from "@/actions/recurring";
import { RecurringFormDialog } from "./recurring-form-dialog";
import { RecurringDeleteDialog } from "./recurring-delete-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Repeat,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface RecurringListProps {
  rules: RecurringTransactionWithCategory[];
  categories: Category[];
}

export function RecurringList({ rules, categories }: RecurringListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isGenerating, setIsGenerating] = useState(false);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringTransactionWithCategory | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState<RecurringTransactionWithCategory | null>(null);

  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredRules = rules.filter((r) => {
    if (statusFilter === "ACTIVE") return r.active;
    if (statusFilter === "INACTIVE") return !r.active;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (rule: RecurringTransactionWithCategory) => {
    setEditingRule(rule);
    setFormDialogOpen(true);
  };

  const handleOpenDelete = (rule: RecurringTransactionWithCategory) => {
    setDeletingRule(rule);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = (rule: RecurringTransactionWithCategory) => {
    setTogglingId(rule.id);
    startTransition(async () => {
      const result = await toggleRecurringStatusAction(rule.id, !rule.active);
      setTogglingId(null);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message || "Failed to update status.");
      }
    });
  };

  const handleManualGeneration = async () => {
    setIsGenerating(true);
    const result = await triggerGenerateDueAction();
    setIsGenerating(false);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message || "Failed to generate due transactions.");
    }
  };

  const renderFrequencyBadge = (freq: RecurrenceFrequency) => {
    switch (freq) {
      case RecurrenceFrequency.DAILY:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Daily</Badge>;
      case RecurrenceFrequency.WEEKDAYS:
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Weekdays (Mon-Fri)</Badge>;
      case RecurrenceFrequency.WEEKLY:
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Weekly</Badge>;
      case RecurrenceFrequency.MONTHLY:
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Monthly</Badge>;
      case RecurrenceFrequency.YEARLY:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Yearly</Badge>;
      case RecurrenceFrequency.CUSTOM:
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">Custom Interval</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Trigger & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-background shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Repeat className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">Recurring Transaction Rules</h2>
            <p className="text-xs text-muted-foreground">Automate routine bills, subscriptions, and daily expenses</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleManualGeneration}
            disabled={isGenerating}
            className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-600" />
            )}
            Generate Due Entries
          </Button>

          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Recurring Rule
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Rules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Rules</SelectItem>
            <SelectItem value="ACTIVE">Active Rules</SelectItem>
            <SelectItem value="INACTIVE">Inactive Rules</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground font-medium">
          Showing {filteredRules.length} of {rules.length} rule(s)
        </span>
      </div>

      {/* Rules Table */}
      <Card className="overflow-hidden border">
        {filteredRules.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="font-semibold">Rule Name</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Frequency</TableHead>
                <TableHead className="font-semibold">Next Occurrence</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => {
                const nextDate = getNextOccurrenceDate(rule);

                return (
                  <TableRow
                    key={rule.id}
                    className={!rule.active ? "opacity-60 bg-slate-50/50 dark:bg-slate-900/20" : ""}
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex flex-col">
                        <span>{rule.name}</span>
                        {rule.notes && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                            {rule.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-bold whitespace-nowrap">
                      <span className={rule.type === TransactionType.INCOME ? "text-emerald-600" : "text-rose-600"}>
                        {rule.type === TransactionType.INCOME ? "+" : "-"} {formatCurrency(rule.amount)}
                      </span>
                    </TableCell>

                    <TableCell>
                      {rule.type === TransactionType.INCOME ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Income
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                          Expense
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="font-medium">{rule.category.name}</TableCell>

                    <TableCell>{renderFrequencyBadge(rule.frequency)}</TableCell>

                    <TableCell className="whitespace-nowrap text-xs">
                      {nextDate ? (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDateDisplay(nextDate)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Ended / None</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {rule.active ? (
                        <Badge variant="outline" className="bg-emerald-50/50 text-emerald-600 border-emerald-200 gap-1 font-normal">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1 font-normal">
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(rule)}
                          disabled={isPending && togglingId === rule.id}
                        >
                          {isPending && togglingId === rule.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : rule.active ? (
                            <span className="text-xs text-muted-foreground hover:text-foreground">Deactivate</span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium">Activate</span>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(rule)}
                          title="Edit rule"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(rule)}
                          title="Delete rule"
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground w-fit">
              <Repeat className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base">No recurring rules found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No recurring rules match your current filter. Click 'Add Recurring Rule' to automate daily commute or monthly bill entries.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <RecurringFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        categories={categories}
        rule={editingRule}
      />

      <RecurringDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        rule={deletingRule}
      />
    </div>
  );
}
