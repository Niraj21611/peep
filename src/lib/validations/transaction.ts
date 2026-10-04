import { z } from "zod";
import { TransactionType } from "@prisma/client";

export const transactionSchema = z.object({
  date: z.coerce.date({
    required_error: "Transaction date is required",
    invalid_type_error: "Invalid transaction date format",
  }),
  type: z.nativeEnum(TransactionType, {
    errorMap: () => ({ message: "Transaction type must be INCOME or EXPENSE" }),
  }),
  categoryId: z.string().min(1, "Please select a valid category"),
  amount: z.coerce
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a valid number",
    })
    .positive("Amount must be greater than 0"),
  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
