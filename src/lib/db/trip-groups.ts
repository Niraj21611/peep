import { prisma } from "./prisma";
import { roundMoney } from "@/lib/utils";

export interface CreateTripGroupInput {
  userId: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateTripGroupInput {
  name?: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

/**
 * Get all trip groups for a user with transaction counts
 */
export async function getTripGroupsByUserId(userId: string) {
  return prisma.tripGroup.findMany({
    where: { userId },
    include: {
      transactions: {
        include: { category: true },
      },
      budgets: {
        include: { category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single trip group with full details
 */
export async function getTripGroupById(id: string, userId: string) {
  return prisma.tripGroup.findFirst({
    where: { id, userId },
    include: {
      transactions: {
        include: { category: true },
        orderBy: { date: "desc" },
      },
      budgets: {
        include: { category: true },
      },
    },
  });
}

/**
 * Create a new trip group
 */
export async function createTripGroup(input: CreateTripGroupInput) {
  return prisma.tripGroup.create({
    data: {
      userId: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
    },
    include: {
      transactions: {
        include: { category: true },
      },
      budgets: {
        include: { category: true },
      },
    },
  });
}

/**
 * Update a trip group
 */
export async function updateTripGroup(
  id: string,
  userId: string,
  data: UpdateTripGroupInput
) {
  const existing = await prisma.tripGroup.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  return prisma.tripGroup.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
    },
    include: {
      transactions: {
        include: { category: true },
      },
      budgets: {
        include: { category: true },
      },
    },
  });
}

/**
 * Delete a trip group (unlinks transactions, does not delete them)
 */
export async function deleteTripGroup(id: string, userId: string) {
  const existing = await prisma.tripGroup.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  // Unlink all transactions from this group first
  await prisma.transaction.updateMany({
    where: { tripGroupId: id, userId },
    data: { tripGroupId: null },
  });

  return prisma.tripGroup.delete({
    where: { id },
  });
}

/**
 * Add transactions to a trip group
 */
export async function addTransactionsToTripGroup(
  tripGroupId: string,
  transactionIds: string[],
  userId: string
) {
  const tripGroup = await prisma.tripGroup.findFirst({
    where: { id: tripGroupId, userId },
  });

  if (!tripGroup) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  // Verify all transactions belong to the user
  const transactions = await prisma.transaction.findMany({
    where: {
      id: { in: transactionIds },
      userId,
    },
  });

  if (transactions.length !== transactionIds.length) {
    throw new Error("Some transactions were not found or not owned by you.");
  }

  return prisma.transaction.updateMany({
    where: {
      id: { in: transactionIds },
      userId,
    },
    data: { tripGroupId },
  });
}

/**
 * Remove a transaction from a trip group
 */
export async function removeTransactionFromTripGroup(
  transactionId: string,
  userId: string
) {
  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!tx) {
    throw new Error("Transaction not found or unauthorized access.");
  }

  return prisma.transaction.update({
    where: { id: transactionId },
    data: { tripGroupId: null },
  });
}

/**
 * Upsert a budget entry for a trip group category
 */
export async function upsertTripGroupBudget(
  tripGroupId: string,
  categoryId: string,
  amount: number,
  userId: string
) {
  const tripGroup = await prisma.tripGroup.findFirst({
    where: { id: tripGroupId, userId },
  });

  if (!tripGroup) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  return prisma.tripGroupBudget.upsert({
    where: {
      tripGroupId_categoryId: { tripGroupId, categoryId },
    },
    update: { amount: roundMoney(amount) },
    create: {
      tripGroupId,
      categoryId,
      amount: roundMoney(amount),
    },
    include: { category: true },
  });
}

/**
 * Delete a budget entry from a trip group
 */
export async function deleteTripGroupBudget(
  budgetId: string,
  tripGroupId: string,
  userId: string
) {
  const tripGroup = await prisma.tripGroup.findFirst({
    where: { id: tripGroupId, userId },
  });

  if (!tripGroup) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  return prisma.tripGroupBudget.delete({
    where: { id: budgetId },
  });
}

/**
 * Get all trip groups (lightweight, for selection dropdowns)
 */
export async function getTripGroupsListByUserId(userId: string) {
  return prisma.tripGroup.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { name: "asc" },
  });
}
