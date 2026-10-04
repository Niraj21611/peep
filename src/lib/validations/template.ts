import { z } from "zod";
import { TransactionType } from "@prisma/client";
import { evaluateAmountChunks } from "@/lib/utils/math-eval";

export const templateSchema = z
  .object({
    name: z
      .string()
      .min(1, "Template name is required")
      .max(100, "Template name cannot exceed 100 characters")
      .transform((val) => val.trim()),
    type: z.nativeEnum(TransactionType, {
      errorMap: () => ({ message: "Transaction type must be INCOME or EXPENSE" }),
    }),
    categoryId: z.string().min(1, "Please select a valid category"),
    amountInput: z.string().min(1, "Amount is required"),
    amountExpression: z.string().optional(),
    notes: z
      .string()
      .max(500, "Notes cannot exceed 500 characters")
      .optional()
      .transform((val) => val?.trim() || undefined),
  })
  .transform((data, ctx) => {
    const evalResult = evaluateAmountChunks(data.amountInput);

    if (!evalResult.isValid || evalResult.value === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amountInput"],
        message: evalResult.error || "Invalid amount or expression",
      });
      return z.NEVER;
    }

    return {
      name: data.name,
      type: data.type,
      categoryId: data.categoryId,
      amount: evalResult.value,
      amountExpression: evalResult.hasExpression
        ? data.amountInput.trim()
        : data.amountExpression?.trim() || undefined,
      notes: data.notes,
    };
  });

export type TemplateInput = z.infer<typeof templateSchema>;
