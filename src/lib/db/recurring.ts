import { prisma } from "./prisma";
import { RecurrenceFrequency, TransactionType } from "@prisma/client";

export interface CreateRecurringTransactionInput {
  userId: string;
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate?: Date;
  active?: boolean;
  notes?: string;
  recurrenceConfig?: string;
}

export interface UpdateRecurringTransactionInput {
  name?: string;
  amount?: number;
  type?: TransactionType;
  categoryId?: string;
  frequency?: RecurrenceFrequency;
  startDate?: Date;
  endDate?: Date;
  active?: boolean;
  notes?: string;
  recurrenceConfig?: string;
}

/**
 * Get all recurring transactions for a user
 */
export async function getRecurringTransactionsByUserId(
  userId: string,
  activeOnly = true
) {
  return prisma.recurringTransaction.findMany({
    where: {
      userId,
      ...(activeOnly ? { active: true } : {}),
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get single recurring transaction by ID
 */
export async function getRecurringTransactionById(id: string, userId: string) {
  return prisma.recurringTransaction.findFirst({
    where: { id, userId },
    include: { category: true },
  });
}

/**
 * Create a recurring transaction template
 */
export async function createRecurringTransaction(
  input: CreateRecurringTransactionInput
) {
  return prisma.recurringTransaction.create({
    data: {
      userId: input.userId,
      name: input.name.trim(),
      amount: input.amount,
      type: input.type,
      categoryId: input.categoryId,
      frequency: input.frequency,
      startDate: input.startDate,
      endDate: input.endDate,
      active: input.active ?? true,
      notes: input.notes?.trim(),
      recurrenceConfig: input.recurrenceConfig,
    },
    include: { category: true },
  });
}

/**
 * Update recurring transaction
 */
export async function updateRecurringTransaction(
  id: string,
  userId: string,
  data: UpdateRecurringTransactionInput
) {
  return prisma.recurringTransaction.update({
    where: { id, userId },
    data,
    include: { category: true },
  });
}

/**
 * Delete recurring transaction template
 */
export async function deleteRecurringTransaction(id: string, userId: string) {
  return prisma.recurringTransaction.delete({
    where: { id, userId },
  });
}
