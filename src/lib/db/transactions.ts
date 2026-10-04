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
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Get paginated transactions with filtering and summary totals for user
 */
export async function getTransactionsByUserId(
  userId: string,
  options: TransactionFilterOptions = {}
) {
  const {
    startDate,
    endDate,
    categoryId,
    type,
    search,
    page = 1,
    pageSize = 15,
  } = options;

  const whereCondition = {
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
    ...(search
      ? {
          OR: [
            { notes: { contains: search, mode: "insensitive" as const } },
            { category: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * pageSize;

  const [transactions, totalCount, aggregateSummary] = await Promise.all([
    prisma.transaction.findMany({
      where: whereCondition,
      include: { category: true },
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.transaction.count({ where: whereCondition }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: whereCondition,
      _sum: { amount: true },
    }),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const group of aggregateSummary) {
    if (group.type === TransactionType.INCOME) {
      totalIncome = group._sum.amount || 0;
    } else if (group.type === TransactionType.EXPENSE) {
      totalExpense = group._sum.amount || 0;
    }
  }

  const netBalance = totalIncome - totalExpense;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return {
    transactions,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
    summary: {
      totalIncome,
      totalExpense,
      netBalance,
    },
  };
}

/**
 * Get single transaction by ID and user
 */
export async function getTransactionById(id: string, userId: string) {
  return prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true },
  });
}

/**
 * Create transaction (verifying category ownership)
 */
export async function createTransaction(input: CreateTransactionInput) {
  // Verify category exists and belongs to user
  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, userId: input.userId },
  });

  if (!category) {
    throw new Error("Invalid or unowned category selected.");
  }

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
 * Update transaction (verifying ownership)
 */
export async function updateTransaction(
  id: string,
  userId: string,
  data: UpdateTransactionInput
) {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Transaction not found or unauthorized access.");
  }

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId },
    });
    if (!category) {
      throw new Error("Invalid or unowned category selected.");
    }
  }

  return prisma.transaction.update({
    where: { id, userId },
    data,
    include: { category: true },
  });
}

/**
 * Delete transaction (verifying ownership)
 */
export async function deleteTransaction(id: string, userId: string) {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Transaction not found or unauthorized access.");
  }

  return prisma.transaction.delete({
    where: { id, userId },
  });
}
