/**
 * Common application types and interfaces
 */

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export type TransactionType = "EXPENSE" | "INCOME" | "TRANSFER";
