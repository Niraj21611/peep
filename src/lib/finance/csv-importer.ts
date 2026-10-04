import { prisma } from "@/lib/db/prisma";
import { TransactionType } from "@prisma/client";
import { normalizeToMidnight } from "./recurring-engine";

export interface ParsedCsvRow {
  rowIndex: number;
  rawDate: string;
  rawType: string;
  rawCategory: string;
  rawAmount: string;
  rawNotes: string;
  
  // Validated fields
  parsedDate?: Date;
  parsedType?: TransactionType;
  categoryId?: string;
  categoryName?: string;
  parsedAmount?: number;
  notes?: string;

  // Validation Status
  status: "VALID" | "INVALID" | "DUPLICATE";
  errors: string[];
}

export interface CsvImportSummary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  rows: ParsedCsvRow[];
}

/**
 * Basic RFC 4180 compliant CSV line parser supporting quoted fields
 */
export function parseCsvContent(csvText: string): string[][] {
  const lines = csvText.split(/\r\n|\n|\r/);
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let insideQuote = false;
    let field = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === "," && !insideQuote) {
        row.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }
    row.push(field.trim());
    result.push(row);
  }

  return result;
}

/**
 * Parse and validate raw CSV content for a specific user
 */
export async function parseAndValidateCsv(
  userId: string,
  csvText: string
): Promise<CsvImportSummary> {
  const parsedGrid = parseCsvContent(csvText);
  if (parsedGrid.length === 0) {
    throw new Error("The uploaded CSV file is empty.");
  }

  // Header detection (normalize keys to lowercase)
  const header = parsedGrid[0]!.map((h) => h.toLowerCase());
  const dateIdx = header.findIndex((h) => h.includes("date"));
  const typeIdx = header.findIndex((h) => h.includes("type"));
  const categoryIdx = header.findIndex((h) => h.includes("category"));
  const amountIdx = header.findIndex((h) => h.includes("amount"));
  const notesIdx = header.findIndex((h) => h.includes("note") || h.includes("description"));

  if (dateIdx === -1 || typeIdx === -1 || categoryIdx === -1 || amountIdx === -1) {
    throw new Error(
      "CSV header must contain Date, Type, Category, and Amount columns. Found columns: " +
        header.join(", ")
    );
  }

  // Fetch all user categories for case-insensitive matching
  const userCategories = await prisma.category.findMany({
    where: { userId },
  });
  const categoryMap = new Map<string, { id: string; name: string }>();
  userCategories.forEach((cat) => {
    categoryMap.set(cat.name.toLowerCase().trim(), { id: cat.id, name: cat.name });
  });

  // Fetch existing user transactions for duplicate detection
  const existingTransactions = await prisma.transaction.findMany({
    where: { userId },
    select: { date: true, type: true, categoryId: true, amount: true },
  });

  const existingSet = new Set<string>();
  existingTransactions.forEach((tx) => {
    const dStr = normalizeToMidnight(tx.date).toISOString().split("T")[0];
    const key = `${dStr}_${tx.type}_${tx.categoryId}_${tx.amount.toFixed(2)}`;
    existingSet.add(key);
  });

  const rows: ParsedCsvRow[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  // Process data rows (skip header index 0)
  for (let i = 1; i < parsedGrid.length; i++) {
    const rawRow = parsedGrid[i]!;
    if (rawRow.length < 4 || rawRow.every((cell) => cell === "")) continue;

    const rawDate = rawRow[dateIdx] || "";
    const rawType = rawRow[typeIdx] || "";
    const rawCategory = rawRow[categoryIdx] || "";
    const rawAmount = rawRow[amountIdx] || "";
    const rawNotes = notesIdx !== -1 ? rawRow[notesIdx] || "" : "";

    const errors: string[] = [];

    // 1. Validate Date
    let parsedDate: Date | undefined;
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) {
      errors.push(`Invalid date format "${rawDate}". Use YYYY-MM-DD or DD/MM/YYYY.`);
    } else {
      parsedDate = dateObj;
    }

    // 2. Validate Type
    let parsedType: TransactionType | undefined;
    const normType = rawType.toUpperCase().trim();
    if (normType === "INCOME" || normType === "INC") {
      parsedType = TransactionType.INCOME;
    } else if (normType === "EXPENSE" || normType === "EXP") {
      parsedType = TransactionType.EXPENSE;
    } else {
      errors.push(`Invalid type "${rawType}". Must be Income or Expense.`);
    }

    // 3. Validate Category
    let categoryId: string | undefined;
    let categoryName: string | undefined;
    const matchedCategory = categoryMap.get(rawCategory.toLowerCase().trim());
    if (!matchedCategory) {
      errors.push(`Category "${rawCategory}" does not exist. Please create category "${rawCategory}" first.`);
    } else {
      categoryId = matchedCategory.id;
      categoryName = matchedCategory.name;
    }

    // 4. Validate Amount
    let parsedAmount: number | undefined;
    const cleanAmountStr = rawAmount.replace(/[^0-9.-]+/g, "");
    const amountNum = parseFloat(cleanAmountStr);
    if (isNaN(amountNum) || amountNum <= 0) {
      errors.push(`Invalid positive amount "${rawAmount}".`);
    } else {
      parsedAmount = amountNum;
    }

    let status: "VALID" | "INVALID" | "DUPLICATE" = "VALID";

    if (errors.length > 0) {
      status = "INVALID";
      invalidCount++;
    } else if (parsedDate && parsedType && categoryId && parsedAmount !== undefined) {
      // Check duplicate
      const dStr = normalizeToMidnight(parsedDate).toISOString().split("T")[0];
      const dupKey = `${dStr}_${parsedType}_${categoryId}_${parsedAmount.toFixed(2)}`;

      if (existingSet.has(dupKey)) {
        status = "DUPLICATE";
        errors.push("Identical transaction already exists in database.");
        duplicateCount++;
      } else {
        // Track within current batch to prevent intra-batch duplicates
        existingSet.add(dupKey);
        validCount++;
      }
    }

    rows.push({
      rowIndex: i,
      rawDate,
      rawType,
      rawCategory,
      rawAmount,
      rawNotes,
      parsedDate,
      parsedType,
      categoryId,
      categoryName,
      parsedAmount,
      notes: rawNotes.trim() || undefined,
      status,
      errors,
    });
  }

  return {
    totalRows: rows.length,
    validCount,
    invalidCount,
    duplicateCount,
    rows,
  };
}
