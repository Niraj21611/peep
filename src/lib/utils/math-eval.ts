/**
 * Evaluates math expressions for transaction amounts (supporting chunks like 5 + 12 - 2 or 5, 12)
 */

export interface MathEvalResult {
  isValid: boolean;
  value: number | null;
  formatted: string | null;
  hasExpression: boolean;
  error?: string;
}

export function evaluateAmountChunks(input: string): MathEvalResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      value: null,
      formatted: null,
      hasExpression: false,
    };
  }

  const raw = input.trim();

  // Normalize commas to plus signs for chunk entry (e.g. "5, 12" -> "5 + 12")
  const normalized = raw.replace(/,/g, " + ");

  // Check if there are operators or commas in original input
  const hasExpression = /[+,\-]/.test(raw);

  // Tokenize safely: allow numbers, decimals, +, -, and whitespace
  // Disallow invalid characters like *, /, letters, etc.
  if (/[^0-9.+\-\s]/.test(normalized)) {
    return {
      isValid: false,
      value: null,
      formatted: null,
      hasExpression,
      error: "Contains invalid characters",
    };
  }

  // Handle trailing operator gracefully while user is typing (e.g. "5 + ")
  let cleanExpr = normalized.trim();
  if (/[+\-\s]$/.test(cleanExpr)) {
    cleanExpr = cleanExpr.replace(/[+\-\s]+$/, "").trim();
  }

  if (!cleanExpr) {
    return {
      isValid: false,
      value: null,
      formatted: null,
      hasExpression,
    };
  }

  try {
    // Parse expression into tokens of (+ or -) and numbers
    const tokens = cleanExpr.split(/\s*([+\-])\s*/).filter(Boolean);

    let total = 0;
    let currentOp = "+";

    for (const token of tokens) {
      if (token === "+" || token === "-") {
        currentOp = token;
      } else {
        const num = parseFloat(token);
        if (isNaN(num)) {
          return {
            isValid: false,
            value: null,
            formatted: null,
            hasExpression,
            error: "Invalid number format",
          };
        }

        if (currentOp === "+") {
          total += num;
        } else if (currentOp === "-") {
          total -= num;
        }
      }
    }

    const rounded = Math.round(total * 100) / 100;

    if (rounded <= 0) {
      return {
        isValid: false,
        value: rounded,
        formatted: rounded.toFixed(2),
        hasExpression,
        error: "Total amount must be greater than 0",
      };
    }

    return {
      isValid: true,
      value: rounded,
      formatted: rounded.toFixed(2),
      hasExpression,
    };
  } catch {
    return {
      isValid: false,
      value: null,
      formatted: null,
      hasExpression,
      error: "Could not evaluate expression",
    };
  }
}
