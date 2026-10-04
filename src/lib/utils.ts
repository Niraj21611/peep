import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx resolution
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Safely round monetary numbers to 2 decimal places to prevent floating point precision issues
 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Safely format monetary amount into currency string (e.g. ₹1,250.00 or $1,250.00)
 */
export function formatCurrency(amount: number, currency = "INR", locale = "en-IN"): string {
  const safeAmount = roundMoney(amount || 0);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

/**
 * Format Date object to YYYY-MM-DD for HTML input[type="date"]
 */
export function formatDateForInput(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Display formatted full date e.g. "Oct 4, 2026"
 */
export function formatDateDisplay(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Derived Day of Week e.g. "Sunday"
 */
export function getDerivedDayOfWeek(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Derived Month & Year e.g. "October 2026"
 */
export function getDerivedMonthYear(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
