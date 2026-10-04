"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteTemplateAction } from "@/actions/templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionTemplateWithCategory } from "@/types";
import { Loader2, Trash2 } from "lucide-react";

interface TemplateDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TransactionTemplateWithCategory | null;
}

export function TemplateDeleteDialog({
  open,
  onOpenChange,
  template,
}: TemplateDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!template) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteTemplateAction(template.id);
      if (res.success) {
        toast.success(res.message || "Template deleted successfully.");
        onOpenChange(false);
      } else {
        toast.error(res.message || "Failed to delete template.");
      }
    } catch {
      toast.error("An error occurred while deleting template.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <Trash2 className="h-5 w-5" /> Delete Template
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete template <strong>"{template.name}"</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              "Delete Template"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
