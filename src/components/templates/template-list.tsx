"use client";

import { useState } from "react";
import { Category, TransactionType } from "@prisma/client";
import { TransactionTemplateWithCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateFormDialog } from "./template-form-dialog";
import { TemplateDeleteDialog } from "./template-delete-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import {
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Zap,
} from "lucide-react";

interface TemplateListProps {
  templates: TransactionTemplateWithCategory[];
  categories: Category[];
}

export function TemplateList({ templates, categories }: TemplateListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Dialog state management
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TransactionTemplateWithCategory | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<TransactionTemplateWithCategory | null>(null);

  // Quick use template dialog
  const [isUseDialogOpen, setIsUseDialogOpen] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // Filter templates
  const filteredTemplates = templates.filter((tmpl) => {
    const matchesSearch =
      tmpl.name.toLowerCase().includes(search.toLowerCase()) ||
      tmpl.notes?.toLowerCase().includes(search.toLowerCase()) ||
      tmpl.category.name.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      typeFilter === "ALL" || tmpl.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tmpl: TransactionTemplateWithCategory) => {
    setEditingTemplate(tmpl);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (tmpl: TransactionTemplateWithCategory) => {
    setDeletingTemplate(tmpl);
    setIsDeleteOpen(true);
  };

  const handleUseTemplate = (tmpl: TransactionTemplateWithCategory) => {
    setActiveTemplateId(tmpl.id);
    setIsUseDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaction Templates</h1>
          <p className="text-sm text-muted-foreground">
            Create presets with amount chunks (e.g. 5, 12 or 5 + 12 - 2) to quickly log daily fixed expenses.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Create Template
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates by name, notes, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
            <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid / Cards */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((tmpl) => (
            <Card key={tmpl.id} className="relative overflow-hidden hover:shadow-md transition-shadow group">
              <CardContent className="p-5 space-y-4">
                {/* Top Section */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base truncate">{tmpl.name}</span>
                      <Badge
                        variant={tmpl.type === TransactionType.EXPENSE ? "destructive" : "default"}
                        className={
                          tmpl.type === TransactionType.EXPENSE
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100 border-rose-200"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 border-emerald-200"
                        }
                      >
                        {tmpl.type === TransactionType.EXPENSE ? (
                          <ArrowDownLeft className="mr-1 h-3 w-3 inline" />
                        ) : (
                          <ArrowUpRight className="mr-1 h-3 w-3 inline" />
                        )}
                        {tmpl.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{tmpl.category.name}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-95 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenEdit(tmpl)}
                      title="Edit template"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                      onClick={() => handleOpenDelete(tmpl)}
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Amount Section */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border flex flex-col gap-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Target Amount:</span>
                    <span className="text-lg font-bold tracking-tight">
                      {formatCurrency(tmpl.amount)}
                    </span>
                  </div>

                  {tmpl.amountExpression && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      <span className="truncate">Chunks: {tmpl.amountExpression}</span>
                    </div>
                  )}
                </div>

                {/* Notes preview */}
                {tmpl.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">
                    "{tmpl.notes}"
                  </p>
                )}

                {/* Direct Action Button */}
                <Button
                  onClick={() => handleUseTemplate(tmpl)}
                  className="w-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
                  size="sm"
                >
                  <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-400" /> Log Transaction Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Copy className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-base">No transaction templates found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {search || typeFilter !== "ALL"
                ? "No templates match your search filters. Try clearing your search."
                : "Save your frequent daily commutes or standard transactions to quickly log them with one click."}
            </p>
            <Button onClick={handleOpenCreate} variant="outline" className="mt-2">
              <Plus className="mr-2 h-4 w-4" /> Create First Template
            </Button>
          </div>
        </Card>
      )}

      {/* Form Dialog for Create/Edit Template */}
      <TemplateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        categories={categories}
        template={editingTemplate}
      />

      {/* Delete Dialog */}
      <TemplateDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        template={deletingTemplate}
      />

      {/* Quick Use Transaction Dialog */}
      <TransactionFormDialog
        open={isUseDialogOpen}
        onOpenChange={setIsUseDialogOpen}
        categories={categories}
        templates={templates}
        initialTemplateId={activeTemplateId}
      />
    </div>
  );
}
