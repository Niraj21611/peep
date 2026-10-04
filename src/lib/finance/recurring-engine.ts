import { prisma } from "@/lib/db/prisma";
import { RecurrenceFrequency, RecurringTransaction } from "@prisma/client";

export interface GenerationResult {
  rulesProcessed: number;
  generatedCount: number;
  newTransactionsCount: number;
}

/**
 * Normalize a Date to midnight UTC (00:00:00.000Z)
 */
export function normalizeToMidnight(date: Date): Date {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Advance date by recurrence frequency
 */
export function advanceDateByFrequency(
  date: Date,
  frequency: RecurrenceFrequency,
  configStr?: string | null
): Date {
  const next = new Date(date);

  switch (frequency) {
    case RecurrenceFrequency.DAILY: {
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    }
    case RecurrenceFrequency.WEEKDAYS: {
      do {
        next.setUTCDate(next.getUTCDate() + 1);
      } while (next.getUTCDay() === 0 || next.getUTCDay() === 6); // 0 = Sunday, 6 = Saturday
      break;
    }
    case RecurrenceFrequency.WEEKLY: {
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    }
    case RecurrenceFrequency.MONTHLY: {
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    }
    case RecurrenceFrequency.YEARLY: {
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
    }
    case RecurrenceFrequency.CUSTOM: {
      let intervalDays = 14;
      if (configStr) {
        try {
          const parsed = JSON.parse(configStr);
          if (parsed.intervalDays && typeof parsed.intervalDays === "number") {
            intervalDays = parsed.intervalDays;
          }
        } catch {
          intervalDays = 14;
        }
      }
      next.setUTCDate(next.getUTCDate() + intervalDays);
      break;
    }
  }

  return next;
}

/**
 * Calculate due occurrence dates for a rule from startDate up to maxDate (inclusive)
 */
export function getDueOccurrenceDates(
  rule: RecurringTransaction,
  maxDate: Date = new Date()
): Date[] {
  if (!rule.active) return [];

  const start = normalizeToMidnight(rule.startDate);
  const cutoff = normalizeToMidnight(maxDate);
  const end = rule.endDate ? normalizeToMidnight(rule.endDate) : null;

  const dueDates: Date[] = [];
  let current = new Date(start);

  while (current <= cutoff) {
    if (end && current > end) break;

    // Check weekday filter if rule frequency is WEEKDAYS
    const day = current.getUTCDay();
    if (rule.frequency !== RecurrenceFrequency.WEEKDAYS || (day !== 0 && day !== 6)) {
      dueDates.push(new Date(current));
    }

    current = advanceDateByFrequency(current, rule.frequency, rule.recurrenceConfig);
  }

  return dueDates;
}

/**
 * Determine next occurrence date for a recurring rule after today
 */
export function getNextOccurrenceDate(
  rule: RecurringTransaction,
  fromDate: Date = new Date()
): Date | null {
  if (!rule.active) return null;

  const due = getDueOccurrenceDates(rule, new Date(fromDate.getTime() + 365 * 24 * 60 * 60 * 1000));
  const normalizedFrom = normalizeToMidnight(fromDate);

  const future = due.find((d) => d >= normalizedFrom);
  return future || null;
}

/**
 * Server-side idempotent generation of due transactions for active rules
 */
export async function generateDueRecurringTransactions(
  userId?: string,
  cutoffDate: Date = new Date()
): Promise<GenerationResult> {
  // 1. Fetch active recurring rules
  const rules = await prisma.recurringTransaction.findMany({
    where: {
      active: true,
      ...(userId ? { userId } : {}),
    },
    include: { category: true },
  });

  let generatedCount = 0;

  for (const rule of rules) {
    const dueDates = getDueOccurrenceDates(rule, cutoffDate);
    if (dueDates.length === 0) continue;

    // Fetch existing transactions for this rule/category to prevent duplicate generation
    const ruleTag = `[Recurring:${rule.id}]`;
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId: rule.userId,
        categoryId: rule.categoryId,
        amount: rule.amount,
        type: rule.type,
        notes: { contains: ruleTag },
      },
    });

    const existingDateSet = new Set(
      existingTransactions.map((tx) => normalizeToMidnight(tx.date).getTime())
    );

    for (const dueDate of dueDates) {
      const dueTime = dueDate.getTime();
      if (existingDateSet.has(dueTime)) {
        continue; // Already generated, skip to maintain idempotency
      }

      const noteText = rule.notes
        ? `${rule.notes} ${ruleTag}`
        : `${rule.name} ${ruleTag}`;

      await prisma.transaction.create({
        data: {
          userId: rule.userId,
          date: dueDate,
          type: rule.type,
          categoryId: rule.categoryId,
          amount: rule.amount,
          notes: noteText,
        },
      });

      generatedCount++;
    }
  }

  return {
    rulesProcessed: rules.length,
    generatedCount,
    newTransactionsCount: generatedCount,
  };
}
