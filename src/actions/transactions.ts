"use server";

import { revalidatePath } from "next/cache";
import { transactionSchema } from "@/lib/validations/transaction";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/db/transactions";
import { requireUser } from "@/lib/auth/session";
import { ActionResponse } from "@/types";

export async function createTransactionAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const rawDate = formData.get("date");
    const rawType = formData.get("type");
    const rawCategoryId = formData.get("categoryId");
    const rawAmount = formData.get("amount");
    const rawNotes = formData.get("notes");

    const validation = transactionSchema.safeParse({
      date: rawDate,
      type: rawType,
      categoryId: rawCategoryId,
      amount: rawAmount,
      notes: rawNotes,
    });

    if (!validation.success) {
      return {
        success: false,
        message: "Please fix the validation errors below.",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const transaction = await createTransaction({
      userId: user.id,
      date: validation.data.date,
      type: validation.data.type,
      categoryId: validation.data.categoryId,
      amount: validation.data.amount,
      notes: validation.data.notes,
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/budgets");

    return {
      success: true,
      message: "Transaction added successfully.",
      data: transaction,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create transaction.",
    };
  }
}

export async function updateTransactionAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const rawDate = formData.get("date");
    const rawType = formData.get("type");
    const rawCategoryId = formData.get("categoryId");
    const rawAmount = formData.get("amount");
    const rawNotes = formData.get("notes");

    const validation = transactionSchema.safeParse({
      date: rawDate,
      type: rawType,
      categoryId: rawCategoryId,
      amount: rawAmount,
      notes: rawNotes,
    });

    if (!validation.success) {
      return {
        success: false,
        message: "Please fix the validation errors below.",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const updated = await updateTransaction(id, user.id, {
      date: validation.data.date,
      type: validation.data.type,
      categoryId: validation.data.categoryId,
      amount: validation.data.amount,
      notes: validation.data.notes,
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/budgets");

    return {
      success: true,
      message: "Transaction updated successfully.",
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update transaction.",
    };
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    await deleteTransaction(id, user.id);

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/budgets");

    return {
      success: true,
      message: "Transaction deleted successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete transaction.",
    };
  }
}
