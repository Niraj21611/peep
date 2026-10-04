import { z } from "zod";
import { CategoryType } from "@prisma/client";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(50, "Category name cannot exceed 50 characters"),
  type: z.nativeEnum(CategoryType, {
    errorMap: () => ({ message: "Category type must be INCOME, EXPENSE, or BOTH" }),
  }),
  active: z.coerce.boolean().optional().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
