import { prisma } from "./prisma";
import { TransactionType } from "@prisma/client";

export interface CreateTransactionInput {
  userId: string;
  date: Date;
  type: TransactionType;
  categoryId: string;
  amount: number;
  notes?: string;
}

export interface UpdateTransactionInput {
  date?: Date;
  type?: TransactionType;
  categoryId?: string;
  amount?: number;
  notes?: string;
}

export interface TransactionFilterOptions {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  type?: TransactionType;
}

/**
 * Get transactions for a user with filtering
 */
export async function getTransactionsByUserId(
  userId: string,
  options: TransactionFilterOptions = {}
) {
  const { startDate, endDate, categoryId, type } = options;

  return prisma.transaction.findMany({
    where: {
      userId,
      ...(categoryId ? { categoryId } : {}),
      ...(type ? { type } : {}),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    },
    include: {
      category: true,
    },
    orderBy: { date: "desc" },
  });
}

/**
 * Get single transaction by ID
 */
export async function getTransactionById(id: string, userId: string) {
  return prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true },
  });
}

/**
 * Create a new transaction
 */
export async function createTransaction(input: CreateTransactionInput) {
  return prisma.transaction.create({
    data: {
      userId: input.userId,
      date: input.date,
      type: input.type,
      categoryId: input.categoryId,
      amount: input.amount,
      notes: input.notes?.trim(),
    },
    include: { category: true },
  });
}

/**
 * Update transaction
 */
export async function updateTransaction(
  id: string,
  userId: string,
  data: UpdateTransactionInput
) {
  return prisma.transaction.update({
    where: { id, userId },
    data,
    include: { category: true },
  });
}

/**
 * Delete transaction
 */
export async function deleteTransaction(id: string, userId: string) {
  return prisma.transaction.delete({
    where: { id, userId },
  });
}
