import { z } from "zod";
import { RecurrenceFrequency, TransactionType } from "@prisma/client";

export const recurringSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
    amount: z.coerce
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Amount must be a valid number",
      })
      .positive("Amount must be greater than 0"),
    type: z.nativeEnum(TransactionType, {
      errorMap: () => ({ message: "Type must be INCOME or EXPENSE" }),
    }),
    categoryId: z.string().min(1, "Please select a category"),
    frequency: z.nativeEnum(RecurrenceFrequency, {
      errorMap: () => ({ message: "Invalid recurrence frequency" }),
    }),
    startDate: z.coerce.date({
      required_error: "Start date is required",
      invalid_type_error: "Invalid start date format",
    }),
    endDate: z.coerce
      .date({
        invalid_type_error: "Invalid end date format",
      })
      .optional()
      .nullable(),
    notes: z
      .string()
      .max(500, "Notes cannot exceed 500 characters")
      .optional()
      .transform((val) => val?.trim() || undefined),
    intervalDays: z.coerce.number().optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  );

export type RecurringInput = z.infer<typeof recurringSchema>;
