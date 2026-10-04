import { prisma } from "@/lib/db/prisma";
import { TransactionType, CategoryType } from "@prisma/client";
import { getBudgetStatus, BudgetStatus } from "@/constants/budget";
import { roundMoney } from "@/lib/utils";

export interface DashboardSummaryData {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
}

export interface CategoryExpenseBreakdown {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
}

export interface MonthlyComparisonData {
  month: string; // e.g. "Oct 2026"
  monthKey: string; // e.g. "2026-10"
  income: number;
  expense: number;
  net: number;
}

export interface DashboardHighlights {
  highestSpendingCategory: { name: string; amount: number } | null;
  largestTransaction: {
    id: string;
    amount: number;
    type: TransactionType;
    categoryName: string;
    date: Date;
  } | null;
}

export interface DashboardBudgetSummary {
  month: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentUsed: number;
  status: BudgetStatus;
  overBudgetCount: number;
}

/**
 * Calculate Summary Metrics for Date Range
 */
export async function getDashboardSummary(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DashboardSummaryData> {
  const whereCondition = {
    userId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  const [aggregateSummary, transactionCount] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: whereCondition,
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: whereCondition }),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const group of aggregateSummary) {
    if (group.type === TransactionType.INCOME) {
      totalIncome = roundMoney(group._sum.amount || 0);
    } else if (group.type === TransactionType.EXPENSE) {
      totalExpense = roundMoney(group._sum.amount || 0);
    }
  }

  const netSavings = roundMoney(totalIncome - totalExpense);
  const savingsRate =
    totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 1000) / 10) : 0;

  return {
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    transactionCount,
  };
}

/**
 * Get Expense Breakdown by Category for Date Range
 */
export async function getExpensesByCategory(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CategoryExpenseBreakdown[]> {
  const expenseGroup = await prisma.transaction.groupBy({
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
    orderBy: {
      _sum: {
        amount: "desc",
      },
    },
  });

  if (expenseGroup.length === 0) return [];

  const categoryIds = expenseGroup.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const totalExpense = roundMoney(
    expenseGroup.reduce((acc, g) => acc + (g._sum.amount || 0), 0)
  );

  return expenseGroup.map((group) => {
    const amount = roundMoney(group._sum.amount || 0);
    const percentage =
      totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0;

    return {
      categoryId: group.categoryId,
      name: categoryMap.get(group.categoryId) || "Uncategorized",
      amount,
      percentage,
    };
  });
}

/**
 * Get Historical Monthly Income vs Expense Comparison (Last N months)
 */
export async function getMonthlySummary(
  userId: string,
  monthsCount = 6
): Promise<MonthlyComparisonData[]> {
  const result: MonthlyComparisonData[] = [];
  const now = new Date();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const year = new Date(now.getFullYear(), now.getMonth() - i, 1).getFullYear();
    const monthIdx = new Date(now.getFullYear(), now.getMonth() - i, 1).getMonth();

    const startDate = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999));

    const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
    const monthLabel = startDate.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      year: "numeric",
    });

    const aggregate = await prisma.transaction.groupBy({
      by: ["type"],
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    let income = 0;
    let expense = 0;

    for (const group of aggregate) {
      if (group.type === TransactionType.INCOME) {
        income = roundMoney(group._sum.amount || 0);
      } else if (group.type === TransactionType.EXPENSE) {
        expense = roundMoney(group._sum.amount || 0);
      }
    }

    result.push({
      month: monthLabel,
      monthKey,
      income,
      expense,
      net: roundMoney(income - expense),
    });
  }

  return result;
}

/**
 * Get Dashboard Highlights (Highest Spending Category & Largest Transaction)
 */
export async function getDashboardHighlights(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DashboardHighlights> {
  const [highestGroup, largestTx] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 1,
    }),
    prisma.transaction.findFirst({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      include: { category: true },
      orderBy: { amount: "desc" },
    }),
  ]);

  let highestSpendingCategory: { name: string; amount: number } | null = null;

  if (highestGroup.length > 0 && highestGroup[0]?._sum.amount) {
    const cat = await prisma.category.findUnique({
      where: { id: highestGroup[0].categoryId },
    });
    if (cat) {
      highestSpendingCategory = {
        name: cat.name,
        amount: roundMoney(highestGroup[0]._sum.amount),
      };
    }
  }

  const largestTransaction = largestTx
    ? {
        id: largestTx.id,
        amount: roundMoney(largestTx.amount),
        type: largestTx.type,
        categoryName: largestTx.category.name,
        date: largestTx.date,
      }
    : null;

  return {
    highestSpendingCategory,
    largestTransaction,
  };
}

/**
 * Get Budget Overview for Selected Month
 */
export async function getDashboardBudgetOverview(
  userId: string,
  month: string
): Promise<DashboardBudgetSummary> {
  const [yStr, mStr] = month.split("-");
  const year = parseInt(yStr || "2026", 10);
  const monthIdx = parseInt(mStr || "10", 10) - 1;

  const startDate = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999));

  const categories = await prisma.category.findMany({
    where: {
      userId,
      active: true,
      type: { in: [CategoryType.EXPENSE, CategoryType.BOTH] },
    },
  });

  const budgets = await prisma.budget.findMany({
    where: { userId, month },
  });

  const spentGroup = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: TransactionType.EXPENSE,
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  const budgetMap = new Map(budgets.map((b) => [b.categoryId, roundMoney(b.amount)]));
  const spentMap = new Map(spentGroup.map((s) => [s.categoryId, roundMoney(s._sum.amount || 0)]));

  let rawTotalBudget = 0;
  let rawTotalSpent = 0;
  let overBudgetCount = 0;

  for (const cat of categories) {
    const bAmt = budgetMap.get(cat.id) || 0;
    const sAmt = spentMap.get(cat.id) || 0;

    rawTotalBudget += bAmt;
    rawTotalSpent += sAmt;

    if (bAmt > 0 && sAmt > bAmt) {
      overBudgetCount++;
    }
  }

  const totalBudget = roundMoney(rawTotalBudget);
  const totalSpent = roundMoney(rawTotalSpent);
  const totalRemaining = roundMoney(totalBudget - totalSpent);
  const percentUsed =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;
  const status = getBudgetStatus(totalBudget, percentUsed);

  return {
    month,
    totalBudget,
    totalSpent,
    totalRemaining,
    percentUsed,
    status,
    overBudgetCount,
  };
}
