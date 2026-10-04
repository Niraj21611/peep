import {
  User,
  Category,
  Transaction,
  Budget,
  RecurringTransaction,
  TransactionTemplate,
  CategoryType,
  TransactionType,
  RecurrenceFrequency,
} from "@prisma/client";

export type {
  User,
  Category,
  Transaction,
  Budget,
  RecurringTransaction,
  TransactionTemplate,
  CategoryType,
  TransactionType,
  RecurrenceFrequency,
};

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export type TransactionWithCategory = Transaction & {
  category: Category;
};

export type BudgetWithCategory = Budget & {
  category: Category;
};

export type RecurringTransactionWithCategory = RecurringTransaction & {
  category: Category;
};

export type TransactionTemplateWithCategory = TransactionTemplate & {
  category: Category;
};
