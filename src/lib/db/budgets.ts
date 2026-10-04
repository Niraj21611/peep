import { prisma } from "./prisma";
import { CategoryType, TransactionType, Category } from "@prisma/client";
import { getBudgetStatus, BudgetStatus } from "@/constants/budget";
import { roundMoney } from "@/lib/utils";

export interface UpsertBudgetInput {
  userId: string;
  categoryId: string;
  month: string; // Format "YYYY-MM"
  amount: number;
}

export interface CalculatedCategoryBudget {
  categoryId: string;
  category: Category;
  budgetId?: string;
  month: string;
  budgetAmount: number;
  actualSpent: number;
  remaining: number;
  percentUsed: number;
  status: BudgetStatus;
}

export interface BudgetSummary {
  month: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentUsed: number;
  overallStatus: BudgetStatus;
  overBudgetCount: number;
  nearLimitCount: number;
}

/**
 * Get budgets with dynamic actual spent calculations for a target month (YYYY-MM)
 */
export async function getBudgetsWithCalculations(userId: string, month: string) {
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr || "2026", 10);
  const monthIdx = parseInt(monthStr || "10", 10) - 1;

  const startDate = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999));

  // Run all independent queries concurrently to prevent waterfall latency
  const [categories, budgets, expenseAggregations] = await Promise.all([
    prisma.category.findMany({
      where: {
        userId,
        active: true,
        type: { in: [CategoryType.EXPENSE, CategoryType.BOTH] },
      },
      orderBy: { name: "asc" },
    }),
    prisma.budget.findMany({
      where: {
        userId,
        month,
      },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);
  const budgetMap = new Map(budgets.map((b) => [b.categoryId, b]));
  const spentMap = new Map(
    expenseAggregations.map((agg) => [agg.categoryId, roundMoney(agg._sum.amount || 0)])
  );

  // 4. Calculate dynamic category budget rows
  let rawTotalBudget = 0;
  let rawTotalSpent = 0;
  let overBudgetCount = 0;
  let nearLimitCount = 0;

  const categoryBudgets: CalculatedCategoryBudget[] = categories.map((category) => {
    const existingBudget = budgetMap.get(category.id);
    const budgetAmount = roundMoney(existingBudget?.amount || 0);
    const actualSpent = roundMoney(spentMap.get(category.id) || 0);
    const remaining = roundMoney(budgetAmount - actualSpent);

    const percentUsed =
      budgetAmount > 0
        ? Math.round((actualSpent / budgetAmount) * 1000) / 10
        : actualSpent > 0
        ? 100
        : 0;

    const status = getBudgetStatus(budgetAmount, percentUsed);

    if (status === "OVER_BUDGET") overBudgetCount++;
    if (status === "NEAR_LIMIT") nearLimitCount++;

    rawTotalBudget += budgetAmount;
    rawTotalSpent += actualSpent;

    return {
      categoryId: category.id,
      category,
      budgetId: existingBudget?.id,
      month,
      budgetAmount,
      actualSpent,
      remaining,
      percentUsed,
      status,
    };
  });

  const totalBudget = roundMoney(rawTotalBudget);
  const totalSpent = roundMoney(rawTotalSpent);
  const totalRemaining = roundMoney(totalBudget - totalSpent);
  const overallPercentUsed =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;
  const overallStatus = getBudgetStatus(totalBudget, overallPercentUsed);

  const summary: BudgetSummary = {
    month,
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentUsed,
    overallStatus,
    overBudgetCount,
    nearLimitCount,
  };

  return {
    categoryBudgets,
    summary,
  };
}

/**
 * Upsert category budget target for a month
 */
export async function upsertBudget(input: UpsertBudgetInput) {
  const { userId, categoryId, month, amount } = input;

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });

  if (!category) {
    throw new Error("Invalid or unowned category selected.");
  }

  const safeAmount = roundMoney(amount);

  return prisma.budget.upsert({
    where: {
      userId_categoryId_month: {
        userId,
        categoryId,
        month,
      },
    },
    update: {
      amount: safeAmount,
    },
    create: {
      userId,
      categoryId,
      month,
      amount: safeAmount,
    },
    include: {
      category: true,
    },
  });
}

/**
 * Delete a budget target entry
 */
export async function deleteBudget(id: string, userId: string) {
  const existing = await prisma.budget.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Budget target not found or unauthorized access.");
  }

  return prisma.budget.delete({
    where: { id, userId },
  });
}
