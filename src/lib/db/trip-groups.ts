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
      members: {
        include: { expenses: true },
      },
      memberExpenses: {
        include: { member: true, category: true },
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
      members: {
        include: { expenses: true },
        orderBy: { name: "asc" },
      },
      memberExpenses: {
        include: { member: true, category: true },
        orderBy: { date: "desc" },
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
      members: {
        include: { expenses: true },
      },
      memberExpenses: {
        include: { member: true, category: true },
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
      members: {
        include: { expenses: true },
      },
      memberExpenses: {
        include: { member: true, category: true },
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

/**
 * Add a member to a trip group
 */
export async function addTripGroupMember(
  tripGroupId: string,
  name: string,
  email: string | undefined,
  userId: string
) {
  const tripGroup = await prisma.tripGroup.findFirst({
    where: { id: tripGroupId, userId },
  });

  if (!tripGroup) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Member name cannot be empty.");
  }

  return prisma.tripGroupMember.create({
    data: {
      tripGroupId,
      name: trimmedName,
      email: email?.trim() || null,
    },
    include: { expenses: true },
  });
}

/**
 * Remove a member from a trip group
 */
export async function deleteTripGroupMember(
  memberId: string,
  tripGroupId: string,
  userId: string
) {
  const tripGroup = await prisma.tripGroup.findFirst({
    where: { id: tripGroupId, userId },
  });

  if (!tripGroup) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  return prisma.tripGroupMember.delete({
    where: { id: memberId },
  });
}

/**
 * Add an expense paid by an added member
 */
export async function createTripMemberExpense(
  input: {
    tripGroupId: string;
    memberId: string;
    categoryId: string;
    amount: number;
    date: Date;
    notes?: string;
  },
  userId: string
) {
  const tripGroup = await prisma.tripGroup.findFirst({
    where: { id: input.tripGroupId, userId },
  });

  if (!tripGroup) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  const member = await prisma.tripGroupMember.findFirst({
    where: { id: input.memberId, tripGroupId: input.tripGroupId },
  });

  if (!member) {
    throw new Error("Trip member not found.");
  }

  return prisma.tripMemberExpense.create({
    data: {
      tripGroupId: input.tripGroupId,
      memberId: input.memberId,
      categoryId: input.categoryId,
      amount: roundMoney(input.amount),
      date: input.date,
      notes: input.notes?.trim() || null,
    },
    include: {
      member: true,
      category: true,
    },
  });
}

/**
 * Update an expense paid by an added member
 */
export async function updateTripMemberExpense(
  id: string,
  tripGroupId: string,
  input: {
    memberId?: string;
    categoryId?: string;
    amount?: number;
    date?: Date;
    notes?: string;
  },
  userId: string
) {
  const tripGroup = await prisma.tripGroup.findFirst({
    where: { id: tripGroupId, userId },
  });

  if (!tripGroup) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  const existing = await prisma.tripMemberExpense.findFirst({
    where: { id, tripGroupId },
  });

  if (!existing) {
    throw new Error("Trip expense not found.");
  }

  return prisma.tripMemberExpense.update({
    where: { id },
    data: {
      ...(input.memberId ? { memberId: input.memberId } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.amount !== undefined ? { amount: roundMoney(input.amount) } : {}),
      ...(input.date ? { date: input.date } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
    },
    include: {
      member: true,
      category: true,
    },
  });
}

/**
 * Delete an expense paid by an added member
 */
export async function deleteTripMemberExpense(
  id: string,
  tripGroupId: string,
  userId: string
) {
  const tripGroup = await prisma.tripGroup.findFirst({
    where: { id: tripGroupId, userId },
  });

  if (!tripGroup) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  return prisma.tripMemberExpense.delete({
    where: { id },
  });
}

/**
 * Create a personal transaction for the trip directly from the trip page
 */
export async function createTripPersonalTransaction(
  input: {
    tripGroupId: string;
    categoryId: string;
    amount: number;
    date: Date;
    notes?: string;
  },
  userId: string
) {
  const tripGroup = await prisma.tripGroup.findFirst({
    where: { id: input.tripGroupId, userId },
  });

  if (!tripGroup) {
    throw new Error("Trip group not found or unauthorized access.");
  }

  return prisma.transaction.create({
    data: {
      userId,
      tripGroupId: input.tripGroupId,
      categoryId: input.categoryId,
      amount: roundMoney(input.amount),
      date: input.date,
      type: "EXPENSE",
      notes: input.notes?.trim() || null,
    },
    include: {
      category: true,
    },
  });
}
