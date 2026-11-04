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
  addTripGroupMember,
  deleteTripGroupMember,
  createTripMemberExpense,
  updateTripMemberExpense,
  deleteTripMemberExpense,
  createTripPersonalTransaction,
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

export async function addTripGroupMemberAction(
  tripGroupId: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();

    if (!name || name.trim().length === 0) {
      return {
        success: false,
        message: "Member name is required.",
        errors: { name: ["Please enter a name for the member."] },
      };
    }

    const member = await addTripGroupMember(
      tripGroupId,
      name,
      email,
      user.id
    );

    revalidatePath("/trip-groups");
    revalidatePath(`/trip-groups/${tripGroupId}`);

    return {
      success: true,
      message: `Member "${member.name}" added to the trip.`,
      data: member,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to add member.";
    if (msg.includes("Unique constraint")) {
      return {
        success: false,
        message: "A member with this name is already in this trip.",
        errors: { name: ["A member with this name already exists in this trip."] },
      };
    }
    return { success: false, message: msg };
  }
}

export async function deleteTripGroupMemberAction(
  memberId: string,
  tripGroupId: string
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    await deleteTripGroupMember(memberId, tripGroupId, user.id);

    revalidatePath("/trip-groups");
    revalidatePath(`/trip-groups/${tripGroupId}`);

    return {
      success: true,
      message: "Member and their trip expenses removed.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to remove member.",
    };
  }
}

export async function createTripExpenseAction(
  tripGroupId: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const payer = formData.get("payer")?.toString(); // "ME" or memberId
    const categoryId = formData.get("categoryId")?.toString();
    const amountStr = formData.get("amount")?.toString();
    const dateStr = formData.get("date")?.toString();
    const notes = formData.get("notes")?.toString();

    if (!payer) {
      return {
        success: false,
        message: "Please select who paid for this expense.",
        errors: { payer: ["Select who paid."] },
      };
    }

    if (!categoryId) {
      return {
        success: false,
        message: "Category is required.",
        errors: { categoryId: ["Select a category."] },
      };
    }

    const amount = parseFloat(amountStr || "0");
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: "Please enter a valid amount greater than 0.",
        errors: { amount: ["Enter a valid amount."] },
      };
    }

    const date = dateStr ? new Date(dateStr) : new Date();

    if (payer === "ME") {
      // Create user's personal transaction linked to this trip
      const tx = await createTripPersonalTransaction(
        {
          tripGroupId,
          categoryId,
          amount,
          date,
          notes,
        },
        user.id
      );

      revalidatePath("/trip-groups");
      revalidatePath(`/trip-groups/${tripGroupId}`);
      revalidatePath("/transactions");
      revalidatePath("/dashboard");

      return {
        success: true,
        message: `Your expense of ₹${amount.toFixed(2)} recorded for this trip.`,
        data: tx,
      };
    } else {
      // Create member expense (isolated from personal ledger)
      const memberExpense = await createTripMemberExpense(
        {
          tripGroupId,
          memberId: payer,
          categoryId,
          amount,
          date,
          notes,
        },
        user.id
      );

      revalidatePath("/trip-groups");
      revalidatePath(`/trip-groups/${tripGroupId}`);

      return {
        success: true,
        message: `Expense of ₹${amount.toFixed(2)} recorded for ${memberExpense.member.name}.`,
        data: memberExpense,
      };
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to record expense.",
    };
  }
}

export async function updateTripMemberExpenseAction(
  id: string,
  tripGroupId: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    const memberId = formData.get("memberId")?.toString();
    const categoryId = formData.get("categoryId")?.toString();
    const amountStr = formData.get("amount")?.toString();
    const dateStr = formData.get("date")?.toString();
    const notes = formData.get("notes")?.toString();

    const amount = amountStr ? parseFloat(amountStr) : undefined;
    const date = dateStr ? new Date(dateStr) : undefined;

    const updated = await updateTripMemberExpense(
      id,
      tripGroupId,
      {
        memberId,
        categoryId,
        amount,
        date,
        notes,
      },
      user.id
    );

    revalidatePath("/trip-groups");
    revalidatePath(`/trip-groups/${tripGroupId}`);

    return {
      success: true,
      message: "Member expense updated successfully.",
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update expense.",
    };
  }
}

export async function deleteTripMemberExpenseAction(
  id: string,
  tripGroupId: string
): Promise<ActionResponse> {
  try {
    const user = await requireUser();

    await deleteTripMemberExpense(id, tripGroupId, user.id);

    revalidatePath("/trip-groups");
    revalidatePath(`/trip-groups/${tripGroupId}`);

    return {
      success: true,
      message: "Member expense removed.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete expense.",
    };
  }
}
