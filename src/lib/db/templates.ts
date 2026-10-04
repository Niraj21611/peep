import { prisma } from "./prisma";
import { TransactionType } from "@prisma/client";
import { roundMoney } from "@/lib/utils";

export interface CreateTemplateInput {
  userId: string;
  name: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  amountExpression?: string;
  notes?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  type?: TransactionType;
  categoryId?: string;
  amount?: number;
  amountExpression?: string;
  notes?: string;
}

/**
 * Get all templates for a user with category relation
 */
export async function getTemplatesByUserId(userId: string) {
  return prisma.transactionTemplate.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Get single template by ID
 */
export async function getTemplateById(id: string, userId: string) {
  return prisma.transactionTemplate.findFirst({
    where: { id, userId },
    include: { category: true },
  });
}

/**
 * Create a new template
 */
export async function createTemplate(input: CreateTemplateInput) {
  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, userId: input.userId },
  });

  if (!category) {
    throw new Error("Invalid or unowned category selected.");
  }

  return prisma.transactionTemplate.create({
    data: {
      userId: input.userId,
      name: input.name.trim(),
      type: input.type,
      categoryId: input.categoryId,
      amount: roundMoney(input.amount),
      amountExpression: input.amountExpression?.trim() || null,
      notes: input.notes?.trim() || null,
    },
    include: { category: true },
  });
}

/**
 * Update template
 */
export async function updateTemplate(
  id: string,
  userId: string,
  data: UpdateTemplateInput
) {
  const existing = await prisma.transactionTemplate.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Template not found or unauthorized access.");
  }

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId },
    });
    if (!category) {
      throw new Error("Invalid or unowned category selected.");
    }
  }

  return prisma.transactionTemplate.update({
    where: { id, userId },
    data: {
      ...data,
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.amount !== undefined ? { amount: roundMoney(data.amount) } : {}),
      ...(data.amountExpression !== undefined ? { amountExpression: data.amountExpression?.trim() || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
    },
    include: { category: true },
  });
}

/**
 * Delete template
 */
export async function deleteTemplate(id: string, userId: string) {
  const existing = await prisma.transactionTemplate.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Template not found or unauthorized access.");
  }

  return prisma.transactionTemplate.delete({
    where: { id, userId },
  });
}
