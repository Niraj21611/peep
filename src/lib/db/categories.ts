import { prisma } from "./prisma";
import { CategoryType } from "@prisma/client";

export interface CreateCategoryInput {
  userId: string;
  name: string;
  type: CategoryType;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: CategoryType;
  active?: boolean;
}

/**
 * Get all active categories for a user
 */
export async function getCategoriesByUserId(userId: string, includeInactive = false) {
  return prisma.category.findMany({
    where: {
      userId,
      ...(includeInactive ? {} : { active: true }),
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string, userId: string) {
  return prisma.category.findFirst({
    where: { id, userId },
  });
}

/**
 * Create a new dynamic category for a user
 */
export async function createCategory(input: CreateCategoryInput) {
  return prisma.category.create({
    data: {
      userId: input.userId,
      name: input.name.trim(),
      type: input.type,
    },
  });
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, userId: string, data: UpdateCategoryInput) {
  return prisma.category.update({
    where: { id, userId },
    data,
  });
}

/**
 * Soft delete or activate category
 */
export async function toggleCategoryActive(id: string, userId: string, active: boolean) {
  return prisma.category.update({
    where: { id, userId },
    data: { active },
  });
}
