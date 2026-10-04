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

export async function parseAndValidateCsvAction(
  csvContent: string
): Promise<ActionResponse<import("@/lib/finance/csv-importer").CsvImportSummary>> {
  try {
    const user = await requireUser();
    const { parseAndValidateCsv } = await import("@/lib/finance/csv-importer");
    const summary = await parseAndValidateCsv(user.id, csvContent);

    return {
      success: true,
      message: `Parsed ${summary.totalRows} rows (${summary.validCount} valid, ${summary.invalidCount} invalid, ${summary.duplicateCount} duplicate).`,
      data: summary,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to parse CSV file.",
    };
  }
}

export async function executeCsvImportAction(
  rowsToImport: import("@/lib/finance/csv-importer").ParsedCsvRow[]
): Promise<ActionResponse<{ importedCount: number }>> {
  try {
    const user = await requireUser();
    const { prisma } = await import("@/lib/db/prisma");

    const validRows = rowsToImport.filter((r) => r.status === "VALID" && r.parsedDate && r.parsedType && r.categoryId && r.parsedAmount);

    if (validRows.length === 0) {
      return {
        success: false,
        message: "No valid rows selected for import.",
      };
    }

    let importedCount = 0;

    for (const row of validRows) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          date: new Date(row.parsedDate!),
          type: row.parsedType!,
          categoryId: row.categoryId!,
          amount: row.parsedAmount!,
          notes: row.notes,
        },
      });
      importedCount++;
    }

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/budgets");

    return {
      success: true,
      message: `Successfully imported ${importedCount} transaction(s) into your financial ledger.`,
      data: { importedCount },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred during database insertion.",
    };
  }
}
