"use server";

import { revalidatePath } from "next/cache";
import { budgetSchema } from "@/lib/validations/budget";
import { upsertBudget, deleteBudget } from "@/lib/db/budgets";
import { requireUser } from "@/lib/auth/session";
import { ActionResponse } from "@/types";

export async function upsertBudgetAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const rawCategoryId = formData.get("categoryId");
    const rawMonth = formData.get("month");
    const rawAmount = formData.get("amount");

    const validation = budgetSchema.safeParse({
      categoryId: rawCategoryId,
      month: rawMonth,
      amount: rawAmount,
    });

    if (!validation.success) {
      return {
        success: false,
        message: "Please check the form input errors.",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const budget = await upsertBudget({
      userId: user.id,
      categoryId: validation.data.categoryId,
      month: validation.data.month,
      amount: validation.data.amount,
    });

    revalidatePath("/budgets");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Budget for "${budget.category.name}" updated successfully.`,
      data: budget,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update budget.",
    };
  }
}

export async function deleteBudgetAction(id: string): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    await deleteBudget(id, user.id);

    revalidatePath("/budgets");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Budget target removed successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to remove budget.",
    };
  }
}
