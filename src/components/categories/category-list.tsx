"use client";

import { useState, useMemo } from "react";
import { Category, CategoryType } from "@prisma/client";
import { CategoryFormDialog } from "./category-form-dialog";
import { CategoryDeleteDialog } from "./category-delete-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search,
  Pencil,
  Trash2,
  Tags,
  TrendingUp,
  TrendingDown,
  Layers,
} from "lucide-react";

export interface CategoryWithStats extends Category {
  _count?: {
    transactions: number;
    budgets: number;
    recurringTransactions: number;
  };
}

interface CategoryListProps {
  categories: CategoryWithStats[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithStats | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithStats | null>(null);

  // Compute stats
  const totalCount = categories.length;
  const incomeCount = categories.filter(
    (c) => c.type === CategoryType.INCOME || c.type === CategoryType.BOTH
  ).length;
  const expenseCount = categories.filter(
    (c) => c.type === CategoryType.EXPENSE || c.type === CategoryType.BOTH
  ).length;

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
      const matchesType =
        activeTab === "ALL"
          ? true
          : activeTab === "INCOME"
          ? cat.type === CategoryType.INCOME || cat.type === CategoryType.BOTH
          : cat.type === CategoryType.EXPENSE || cat.type === CategoryType.BOTH;

      return matchesSearch && matchesType;
    });
  }, [categories, search, activeTab]);

  const handleAddClick = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleEditClick = (cat: CategoryWithStats) => {
    setEditingCategory(cat);
    setFormOpen(true);
  };

  const handleDeleteClick = (cat: CategoryWithStats) => {
    setDeletingCategory(cat);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="View, add, edit, or remove classification categories for your financial ledger."
      >
        <Button onClick={handleAddClick} className="gap-2 shadow-xs">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Categories
            </CardTitle>
            <Layers className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Available in system</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Income Categories
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{incomeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Used for incoming funds</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expense Categories
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{expenseCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Used for spending tracking</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Container */}
      <Card className="shadow-2xs border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "ALL" | "INCOME" | "EXPENSE")}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                <TabsTrigger value="ALL">All ({totalCount})</TabsTrigger>
                <TabsTrigger value="INCOME">Income ({incomeCount})</TabsTrigger>
                <TabsTrigger value="EXPENSE">Expense ({expenseCount})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="mx-auto p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground w-fit mb-3">
                <Tags className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">No Categories Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                {search
                  ? `No categories matching "${search}"`
                  : "You don't have any categories created for this view yet."}
              </p>
              <Button onClick={handleAddClick} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Category
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                    <TableHead className="w-[300px]">Category Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead className="text-center">Budgets</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((cat) => {
                    const txnCount = cat._count?.transactions ?? 0;
                    const budgetCount = cat._count?.budgets ?? 0;

                    return (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium text-foreground">
                          {cat.name}
                        </TableCell>
                        <TableCell>
                          {cat.type === CategoryType.INCOME ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                              Income
                            </Badge>
                          ) : cat.type === CategoryType.EXPENSE ? (
                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                              Expense
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              Both
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {cat.active ? (
                            <Badge variant="outline" className="text-xs font-normal border-slate-300 dark:border-slate-700">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs font-normal">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">
                          {txnCount > 0 ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {txnCount}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">
                          {budgetCount > 0 ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {budgetCount}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(cat)}
                              title="Edit Category"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(cat)}
                              title="Delete Category"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <CategoryFormDialog
        category={editingCategory}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* Delete Alert Dialog */}
      <CategoryDeleteDialog
        category={deletingCategory}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
