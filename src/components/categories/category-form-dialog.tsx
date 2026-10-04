"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Category, CategoryType } from "@prisma/client";
import { createCategoryAction, updateCategoryAction } from "@/actions/categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CategoryFormDialogProps {
  category?: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryFormDialog({
  category,
  open,
  onOpenChange,
}: CategoryFormDialogProps) {
  const isEditing = !!category;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(CategoryType.EXPENSE);
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setActive(category.active);
    } else {
      setName("");
      setType(CategoryType.EXPENSE);
      setActive(true);
    }
    setErrors({});
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData();
    formData.append("name", name);
    formData.append("type", type);
    formData.append("active", active ? "true" : "false");

    const result = isEditing
      ? await updateCategoryAction(category.id, null, formData)
      : await createCategoryAction(null, formData);

    setLoading(false);

    if (result.success) {
      toast.success(result.message || (isEditing ? "Category updated." : "Category created."));
      onOpenChange(false);
    } else {
      if (result.errors) {
        setErrors(result.errors);
      }
      toast.error(result.message || "An error occurred.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify category details and classification."
              : "Create a custom category for income or expense tracking."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              placeholder="e.g. Subscriptions, Freelance, Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-type">Category Type</Label>
            <Select
              value={type}
              onValueChange={(val) => setType(val as CategoryType)}
              disabled={loading}
            >
              <SelectTrigger id="category-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CategoryType.EXPENSE}>Expense</SelectItem>
                <SelectItem value={CategoryType.INCOME}>Income</SelectItem>
                <SelectItem value={CategoryType.BOTH}>Both (Income & Expense)</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs font-medium text-destructive">{errors.type[0]}</p>
            )}
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="category-status">Status</Label>
              <Select
                value={active ? "active" : "inactive"}
                onValueChange={(val) => setActive(val === "active")}
                disabled={loading}
              >
                <SelectTrigger id="category-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
