"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalculatedCategoryBudget, BudgetSummary } from "@/lib/db/budgets";
import { BudgetStatus } from "@/constants/budget";
import { formatCurrency } from "@/lib/utils";
import { BudgetFormDialog } from "./budget-form-dialog";
import { BudgetDeleteDialog } from "./budget-delete-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  PieChart,
  Pencil,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface BudgetViewProps {
  month: string; // Format "YYYY-MM"
  categoryBudgets: CalculatedCategoryBudget[];
  summary: BudgetSummary;
}

export function BudgetView({ month, categoryBudgets, summary }: BudgetViewProps) {
  const router = useRouter();

  // Dialog States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CalculatedCategoryBudget | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<CalculatedCategoryBudget | null>(null);

  // Month Navigation
  const handlePrevMonth = () => {
    const [yStr, mStr] = month.split("-");
    let year = parseInt(yStr || "2026", 10);
    let m = parseInt(mStr || "10", 10) - 1;
    if (m < 1) {
      m = 12;
      year--;
    }
    const newMonth = `${year}-${String(m).padStart(2, "0")}`;
    router.push(`/budgets?month=${newMonth}`);
  };

  const handleNextMonth = () => {
    const [yStr, mStr] = month.split("-");
    let year = parseInt(yStr || "2026", 10);
    let m = parseInt(mStr || "10", 10) + 1;
    if (m > 12) {
      m = 1;
      year++;
    }
    const newMonth = `${year}-${String(m).padStart(2, "0")}`;
    router.push(`/budgets?month=${newMonth}`);
  };

  const handleMonthInputChange = (val: string) => {
    if (val) {
      router.push(`/budgets?month=${val}`);
    }
  };

  const handleOpenSet = (item: CalculatedCategoryBudget) => {
    setEditingBudget(item);
    setFormDialogOpen(true);
  };

  const handleOpenDelete = (item: CalculatedCategoryBudget) => {
    setDeletingBudget(item);
    setDeleteDialogOpen(true);
  };

  // Helper for Status Badge & Color
  const renderStatusBadge = (status: BudgetStatus) => {
    switch (status) {
      case "WITHIN_BUDGET":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-normal dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Within Budget
          </Badge>
        );
      case "NEAR_LIMIT":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 font-normal dark:bg-amber-950/40 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" /> Near Limit
          </Badge>
        );
      case "OVER_BUDGET":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 font-normal dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-3 w-3" /> Over Budget
          </Badge>
        );
      case "NO_BUDGET":
      default:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1 font-normal dark:bg-slate-800 dark:text-slate-400">
            <HelpCircle className="h-3 w-3" /> No Target Set
          </Badge>
        );
    }
  };

  const getProgressIndicatorClass = (status: BudgetStatus) => {
    switch (status) {
      case "OVER_BUDGET":
        return "bg-rose-600";
      case "NEAR_LIMIT":
        return "bg-amber-500";
      case "WITHIN_BUDGET":
        return "bg-emerald-500";
      default:
        return "bg-slate-300 dark:bg-slate-700";
    }
  };

  // Format Display Month e.g., "October 2026"
  const [yStr, mStr] = month.split("-");
  const displayMonthStr = new Date(
    parseInt(yStr || "2026", 10),
    parseInt(mStr || "10", 10) - 1,
    1
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Month Navigation Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-background shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">{displayMonthStr} Budget</h2>
            <p className="text-xs text-muted-foreground">Category spending targets vs actual ledger expenses</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} title="Previous Month">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <input
            type="month"
            value={month}
            onChange={(e) => handleMonthInputChange(e.target.value)}
            className="h-9 px-3 rounded-md border text-sm font-medium bg-background"
          />

          <Button variant="outline" size="icon" onClick={handleNextMonth} title="Next Month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Aggregate Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(summary.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sum of category targets</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Actual Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(summary.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sum of month expenses</p>
          </CardContent>
        </Card>

        <Card
          className={`border-l-4 ${
            summary.totalRemaining >= 0 ? "border-l-emerald-500" : "border-l-rose-500"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.totalRemaining >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatCurrency(summary.totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall budget surplus/deficit</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Overall Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div>{renderStatusBadge(summary.overallStatus)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.overBudgetCount > 0
                ? `${summary.overBudgetCount} category over budget`
                : `${summary.overallPercentUsed}% total utilized`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Budget Table */}
      <Card className="overflow-hidden border">
        {categoryBudgets.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Monthly Budget</TableHead>
                <TableHead className="font-semibold">Actual Spent</TableHead>
                <TableHead className="font-semibold">Remaining</TableHead>
                <TableHead className="font-semibold w-[180px]">% Used</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryBudgets.map((item) => {
                const isOver = item.status === "OVER_BUDGET";

                return (
                  <TableRow
                    key={item.categoryId}
                    className={
                      isOver
                        ? "bg-rose-50/50 dark:bg-rose-950/20 border-l-4 border-l-rose-500"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isOver && <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />}
                        <span>{item.category.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="font-semibold">
                      {item.budgetAmount > 0 ? (
                        formatCurrency(item.budgetAmount)
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Not set</span>
                      )}
                    </TableCell>

                    <TableCell className="font-medium text-rose-600 dark:text-rose-400">
                      {formatCurrency(item.actualSpent)}
                    </TableCell>

                    <TableCell className="font-semibold">
                      <span
                        className={
                          item.remaining >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400 font-bold"
                        }
                      >
                        {formatCurrency(item.remaining)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span>{item.percentUsed}%</span>
                        </div>
                        <Progress
                          value={item.percentUsed}
                          indicatorClassName={getProgressIndicatorClass(item.status)}
                        />
                      </div>
                    </TableCell>

                    <TableCell>{renderStatusBadge(item.status)}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSet(item)}
                          className="gap-1 text-xs"
                        >
                          {item.budgetAmount > 0 ? (
                            <>
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5 text-primary" /> Set Target
                            </>
                          )}
                        </Button>

                        {item.budgetId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(item)}
                            title="Remove budget target"
                            className="hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        )}
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
              <PieChart className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base">No Expense Categories Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No active expense categories exist. Create expense categories in Category Management to start setting monthly budget targets.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Form & Delete Dialogs */}
      <BudgetFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        targetMonth={month}
        categoryBudget={editingBudget}
      />

      <BudgetDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        categoryBudget={deletingBudget}
      />
    </div>
  );
}
