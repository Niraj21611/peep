"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { ActionResponse } from "@/types";
import {
  createTripGroup,
  updateTripGroup,
  deleteTripGroup,
  addTransactionsToTripGroup,
  removeTransactionFromTripGroup,
  upsertTripGroupBudget,
  deleteTripGroupBudget,
} from "@/lib/db/trip-groups";

export async function createTripGroupAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const startDateStr = formData.get("startDate")?.toString();
    const endDateStr = formData.get("endDate")?.toString();

    if (!name || name.trim().length === 0) {
      return {
        success: false,
        message: "Group name is required.",
        errors: { name: ["Group name is required."] },
      };
    }

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const tripGroup = await createTripGroup({
      userId: user.id,
      name,
      description,
      startDate,
      endDate,
    });

    revalidatePath("/trip-groups");

    return {
      success: true,
      message: `Trip group "${tripGroup.name}" created successfully.`,
      data: tripGroup,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create trip group.";
    // Handle unique constraint (duplicate name)
    if (msg.includes("Unique constraint")) {
      return {
        success: false,
        message: "A trip group with this name already exists.",
        errors: { name: ["A trip group with this name already exists."] },
      };
    }
    return { success: false, message: msg };
  }
}

export async function updateTripGroupAction(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const startDateStr = formData.get("startDate")?.toString();
    const endDateStr = formData.get("endDate")?.toString();

    if (!name || name.trim().length === 0) {
      return {
        success: false,
        message: "Group name is required.",
        errors: { name: ["Group name is required."] },
      };
    }

    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    const tripGroup = await updateTripGroup(id, user.id, {
      name,
      description,
      startDate,
      endDate,
    });

    revalidatePath("/trip-groups");
    revalidatePath(`/trip-groups/${id}`);

    return {
      success: true,
      message: `Trip group "${tripGroup.name}" updated successfully.`,
      data: tripGroup,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update trip group.";
    if (msg.includes("Unique constraint")) {
      return {
        success: false,
        message: "A trip group with this name already exists.",
        errors: { name: ["A trip group with this name already exists."] },
      };
    }
    return { success: false, message: msg };
  }
}

export async function deleteTripGroupAction(id: string): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    await deleteTripGroup(id, user.id);

    revalidatePath("/trip-groups");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Trip group deleted successfully. Transactions have been unlinked.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete trip group.",
    };
  }
}

export async function addTransactionsToTripGroupAction(
  tripGroupId: string,
  transactionIds: string[]
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    if (!transactionIds.length) {
      return {
        success: false,
        message: "No transactions selected.",
      };
    }

    await addTransactionsToTripGroup(tripGroupId, transactionIds, user.id);

    revalidatePath("/trip-groups");
    revalidatePath(`/trip-groups/${tripGroupId}`);
    revalidatePath("/transactions");

    return {
      success: true,
      message: `${transactionIds.length} transaction(s) added to the group.`,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to add transactions to group.",
    };
  }
}

export async function removeTransactionFromTripGroupAction(
  transactionId: string
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    await removeTransactionFromTripGroup(transactionId, user.id);

    revalidatePath("/trip-groups");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Transaction removed from the group.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to remove transaction from group.",
    };
  }
}

export async function upsertTripGroupBudgetAction(
  tripGroupId: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const categoryId = formData.get("categoryId")?.toString();
    const amountStr = formData.get("amount")?.toString();

    if (!categoryId) {
      return {
        success: false,
        message: "Category is required.",
        errors: { categoryId: ["Please select a category."] },
      };
    }

    const amount = parseFloat(amountStr || "0");
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: "Please enter a valid budget amount.",
        errors: { amount: ["Amount must be greater than 0."] },
      };
    }

    const budget = await upsertTripGroupBudget(
      tripGroupId,
      categoryId,
      amount,
      user.id
    );

    revalidatePath("/trip-groups");
    revalidatePath(`/trip-groups/${tripGroupId}`);

    return {
      success: true,
      message: `Budget for "${budget.category.name}" set to ₹${amount.toFixed(2)}.`,
      data: budget,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to set budget for this category.",
    };
  }
}

export async function deleteTripGroupBudgetAction(
  budgetId: string,
  tripGroupId: string
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    await deleteTripGroupBudget(budgetId, tripGroupId, user.id);

    revalidatePath("/trip-groups");
    revalidatePath(`/trip-groups/${tripGroupId}`);

    return {
      success: true,
      message: "Budget entry removed.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete budget entry.",
    };
  }
}
