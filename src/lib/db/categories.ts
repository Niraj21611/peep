import { prisma } from "./prisma";
import { CategoryType } from "@prisma/client";

export interface CreateCategoryInput {
  userId: string;
  name: string;
  type: CategoryType;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: CategoryType;
  active?: boolean;
}

/**
 * Get all categories for a user with usage statistics
 */
export async function getCategoriesByUserId(userId: string, includeInactive = true) {
  return prisma.category.findMany({
    where: {
      userId,
      ...(includeInactive ? {} : { active: true }),
    },
    include: {
      _count: {
        select: {
          transactions: true,
          budgets: true,
          recurringTransactions: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string, userId: string) {
  return prisma.category.findFirst({
    where: { id, userId },
  });
}

/**
 * Get transactions associated with a category
 */
export async function getCategoryTransactions(id: string, userId: string) {
  return prisma.transaction.findMany({
    where: { categoryId: id, userId },
    select: {
      id: true,
      date: true,
      type: true,
      amount: true,
      notes: true,
    },
    orderBy: { date: "desc" },
    take: 50,
  });
}

/**
 * Create a new dynamic category for a user
 */
export async function createCategory(input: CreateCategoryInput) {
  return prisma.category.create({
    data: {
      userId: input.userId,
      name: input.name.trim(),
      type: input.type,
    },
  });
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, userId: string, data: UpdateCategoryInput) {
  return prisma.category.update({
    where: { id, userId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });
}

/**
 * Delete a category if it has no associated transactions, budgets, or recurring rules
 */
export async function deleteCategory(id: string, userId: string) {
  const transactions = await getCategoryTransactions(id, userId);

  if (transactions.length > 0) {
    return {
      deleted: false,
      reason: "HAS_TRANSACTIONS",
      transactions,
    };
  }

  const budgetCount = await prisma.budget.count({
    where: { categoryId: id, userId },
  });
  const recurringCount = await prisma.recurringTransaction.count({
    where: { categoryId: id, userId },
  });

  if (budgetCount > 0 || recurringCount > 0) {
    return {
      deleted: false,
      reason: "HAS_DEPENDENCIES",
      budgetCount,
      recurringCount,
      transactions: [],
    };
  }

  await prisma.category.delete({
    where: { id, userId },
  });

  return {
    deleted: true,
  };
}

/**
 * Soft delete or activate category
 */
export async function toggleCategoryActive(id: string, userId: string, active: boolean) {
  return prisma.category.update({
    where: { id, userId },
    data: { active },
  });
}
