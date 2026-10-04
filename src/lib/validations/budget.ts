import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format"),
  amount: z.coerce
    .number({
      required_error: "Budget amount is required",
      invalid_type_error: "Budget amount must be a number",
    })
    .min(0, "Budget amount cannot be negative"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
