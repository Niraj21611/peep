export const BUDGET_THRESHOLDS = {
  NEAR_LIMIT_PERCENT: 80,
  OVER_BUDGET_PERCENT: 100,
} as const;

export type BudgetStatus = "NO_BUDGET" | "WITHIN_BUDGET" | "NEAR_LIMIT" | "OVER_BUDGET";

/**
 * Determine category budget status based on percent used and target budget
 */
export function getBudgetStatus(budgetAmount: number, percentUsed: number): BudgetStatus {
  if (budgetAmount <= 0) return "NO_BUDGET";
  if (percentUsed > BUDGET_THRESHOLDS.OVER_BUDGET_PERCENT) return "OVER_BUDGET";
  if (percentUsed >= BUDGET_THRESHOLDS.NEAR_LIMIT_PERCENT) return "NEAR_LIMIT";
  return "WITHIN_BUDGET";
}
