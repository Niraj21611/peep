"use server";

import { revalidatePath } from "next/cache";
import { recurringSchema } from "@/lib/validations/recurring";
import {
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from "@/lib/db/recurring";
import { generateDueRecurringTransactions } from "@/lib/finance/recurring-engine";
import { requireUser } from "@/lib/auth/session";
import { ActionResponse } from "@/types";
import { RecurrenceFrequency } from "@prisma/client";

export async function createRecurringAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const rawName = formData.get("name");
    const rawAmount = formData.get("amount");
    const rawType = formData.get("type");
    const rawCategoryId = formData.get("categoryId");
    const rawFrequency = formData.get("frequency");
    const rawStartDate = formData.get("startDate");
    const rawEndDate = formData.get("endDate") || undefined;
    const rawNotes = formData.get("notes") || undefined;
    const rawIntervalDays = formData.get("intervalDays") || undefined;

    const validation = recurringSchema.safeParse({
      name: rawName,
      amount: rawAmount,
      type: rawType,
      categoryId: rawCategoryId,
      frequency: rawFrequency,
      startDate: rawStartDate,
      endDate: rawEndDate,
      notes: rawNotes,
      intervalDays: rawIntervalDays,
    });

    if (!validation.success) {
      return {
        success: false,
        message: "Please check form input errors below.",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    let recurrenceConfig: string | undefined = undefined;
    if (
      validation.data.frequency === RecurrenceFrequency.CUSTOM &&
      validation.data.intervalDays
    ) {
      recurrenceConfig = JSON.stringify({ intervalDays: validation.data.intervalDays });
    }

    const rule = await createRecurringTransaction({
      userId: user.id,
      name: validation.data.name,
      amount: validation.data.amount,
      type: validation.data.type,
      categoryId: validation.data.categoryId,
      frequency: validation.data.frequency,
      startDate: validation.data.startDate,
      endDate: validation.data.endDate || undefined,
      notes: validation.data.notes,
      recurrenceConfig,
    });

    // Automatically trigger due occurrences check
    await generateDueRecurringTransactions(user.id);

    revalidatePath("/recurring");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Recurring rule "${rule.name}" created successfully.`,
      data: rule,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create recurring rule.",
    };
  }
}

export async function updateRecurringAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const rawName = formData.get("name");
    const rawAmount = formData.get("amount");
    const rawType = formData.get("type");
    const rawCategoryId = formData.get("categoryId");
    const rawFrequency = formData.get("frequency");
    const rawStartDate = formData.get("startDate");
    const rawEndDate = formData.get("endDate") || undefined;
    const rawNotes = formData.get("notes") || undefined;
    const rawIntervalDays = formData.get("intervalDays") || undefined;

    const validation = recurringSchema.safeParse({
      name: rawName,
      amount: rawAmount,
      type: rawType,
      categoryId: rawCategoryId,
      frequency: rawFrequency,
      startDate: rawStartDate,
      endDate: rawEndDate,
      notes: rawNotes,
      intervalDays: rawIntervalDays,
    });

    if (!validation.success) {
      return {
        success: false,
        message: "Please check form input errors below.",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    let recurrenceConfig: string | undefined = undefined;
    if (
      validation.data.frequency === RecurrenceFrequency.CUSTOM &&
      validation.data.intervalDays
    ) {
      recurrenceConfig = JSON.stringify({ intervalDays: validation.data.intervalDays });
    }

    const updated = await updateRecurringTransaction(id, user.id, {
      name: validation.data.name,
      amount: validation.data.amount,
      type: validation.data.type,
      categoryId: validation.data.categoryId,
      frequency: validation.data.frequency,
      startDate: validation.data.startDate,
      endDate: validation.data.endDate || undefined,
      notes: validation.data.notes,
      recurrenceConfig,
    });

    revalidatePath("/recurring");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Recurring rule "${updated.name}" updated successfully.`,
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update recurring rule.",
    };
  }
}

export async function toggleRecurringStatusAction(
  id: string,
  active: boolean
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const updated = await updateRecurringTransaction(id, user.id, { active });

    if (active) {
      await generateDueRecurringTransactions(user.id);
    }

    revalidatePath("/recurring");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Recurring rule "${updated.name}" is now ${active ? "active" : "inactive"}.`,
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update status.",
    };
  }
}

export async function deleteRecurringAction(id: string): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    await deleteRecurringTransaction(id, user.id);

    revalidatePath("/recurring");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Recurring transaction rule deleted.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete recurring rule.",
    };
  }
}

export async function triggerGenerateDueAction(): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const result = await generateDueRecurringTransactions(user.id);

    revalidatePath("/recurring");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return {
      success: true,
      message:
        result.generatedCount > 0
          ? `Generated ${result.generatedCount} due transaction(s) across ${result.rulesProcessed} rule(s).`
          : "All active recurring transactions are up to date!",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate due transactions.",
    };
  }
}
