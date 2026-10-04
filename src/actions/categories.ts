"use server";

import { revalidatePath } from "next/cache";
import { categorySchema } from "@/lib/validations/category";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTransactions,
} from "@/lib/db/categories";
import { requireUser } from "@/lib/auth/session";
import { ActionResponse } from "@/types";

export async function createCategoryAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const rawName = formData.get("name");
    const rawType = formData.get("type");

    const validation = categorySchema.safeParse({
      name: rawName,
      type: rawType,
    });

    if (!validation.success) {
      return {
        success: false,
        message: "Please fix the validation errors below.",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const category = await createCategory({
      userId: user.id,
      name: validation.data.name,
      type: validation.data.type,
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    revalidatePath("/recurring");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Category "${category.name}" created successfully.`,
      data: category,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create category.",
    };
  }
}

export async function updateCategoryAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const rawName = formData.get("name");
    const rawType = formData.get("type");
    const rawActive = formData.get("active");

    const validation = categorySchema.safeParse({
      name: rawName,
      type: rawType,
      active: rawActive === "true" || rawActive === "on",
    });

    if (!validation.success) {
      return {
        success: false,
        message: "Please fix the validation errors below.",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const updated = await updateCategory(id, user.id, {
      name: validation.data.name,
      type: validation.data.type,
      active: validation.data.active,
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    revalidatePath("/recurring");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Category "${updated.name}" updated successfully.`,
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update category.",
    };
  }
}

export async function deleteCategoryAction(id: string): Promise<
  ActionResponse<{
    deleted: boolean;
    reason?: string;
    transactions?: Array<{ id: string; date: Date; type: string; amount: number; notes: string | null }>;
    budgetCount?: number;
    recurringCount?: number;
  }>
> {
  try {
    const user = await requireUser();

    const result = await deleteCategory(id, user.id);

    if (!result.deleted) {
      if (result.reason === "HAS_TRANSACTIONS") {
        return {
          success: false,
          message: `Cannot delete category: ${result.transactions.length} transaction(s) are linked to it.`,
          data: {
            deleted: false,
            reason: result.reason,
            transactions: result.transactions,
          },
        };
      }
      return {
        success: false,
        message: `Cannot delete category: It is used in existing budgets or recurring transactions.`,
        data: {
          deleted: false,
          reason: result.reason,
          budgetCount: result.budgetCount,
          recurringCount: result.recurringCount,
        },
      };
    }

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    revalidatePath("/recurring");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Category deleted successfully.",
      data: { deleted: true },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete category.",
    };
  }
}

export async function getCategoryTransactionsAction(id: string) {
  try {
    const user = await requireUser();
    const transactions = await getCategoryTransactions(id, user.id);
    return {
      success: true,
      data: transactions,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch transactions.",
      data: [],
    };
  }
}
