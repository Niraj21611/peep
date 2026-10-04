import { prisma } from "./prisma";

export interface UpsertBudgetInput {
  userId: string;
  categoryId: string;
  month: string; // Format "YYYY-MM"
  amount: number;
}

/**
 * Get all budgets for a given user and month ("YYYY-MM")
 */
export async function getBudgetsByMonth(userId: string, month: string) {
  return prisma.budget.findMany({
    where: {
      userId,
      month,
    },
    include: {
      category: true,
    },
    orderBy: { category: { name: "asc" } },
  });
}

/**
 * Upsert (create or update) a category budget for a specific month
 */
export async function upsertBudget(input: UpsertBudgetInput) {
  const { userId, categoryId, month, amount } = input;

  return prisma.budget.upsert({
    where: {
      userId_categoryId_month: {
        userId,
        categoryId,
        month,
      },
    },
    update: {
      amount,
    },
    create: {
      userId,
      categoryId,
      month,
      amount,
    },
    include: {
      category: true,
    },
  });
}

/**
 * Delete a budget entry
 */
export async function deleteBudget(id: string, userId: string) {
  return prisma.budget.delete({
    where: { id, userId },
  });
}
