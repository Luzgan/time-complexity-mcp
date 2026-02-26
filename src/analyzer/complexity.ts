import type { BigOComplexity } from "./types.js";

const COMPLEXITY_ORDER: BigOComplexity[] = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n^2)",
  "O(n^3)",
  "O(2^n)",
  "O(n!)",
];

export function complexityRank(c: BigOComplexity): number {
  const idx = COMPLEXITY_ORDER.indexOf(c);
  return idx === -1 ? COMPLEXITY_ORDER.length : idx;
}

/** Return the higher of two complexities (worst case). */
export function maxComplexity(
  a: BigOComplexity,
  b: BigOComplexity,
): BigOComplexity {
  if (a === "unknown" || b === "unknown") return "unknown";
  return complexityRank(a) >= complexityRank(b) ? a : b;
}

/** Multiply two complexities (nested operations). */
export function multiplyComplexity(
  outer: BigOComplexity,
  inner: BigOComplexity,
): BigOComplexity {
  if (outer === "unknown" || inner === "unknown") return "unknown";
  if (outer === "O(1)") return inner;
  if (inner === "O(1)") return outer;

  const table: Record<string, BigOComplexity> = {
    "O(n)*O(n)": "O(n^2)",
    "O(n)*O(log n)": "O(n log n)",
    "O(n)*O(n log n)": "O(n^2)",
    "O(n)*O(n^2)": "O(n^3)",
    "O(n^2)*O(n)": "O(n^3)",
    "O(log n)*O(n)": "O(n log n)",
    "O(log n)*O(log n)": "O(log n)",
  };

  const key = `${outer}*${inner}`;
  const reverseKey = `${inner}*${outer}`;
  return table[key] ?? table[reverseKey] ?? "unknown";
}

/** Complexity from loop nesting depth (each level = *n). */
export function complexityFromDepth(depth: number): BigOComplexity {
  if (depth <= 0) return "O(1)";
  if (depth === 1) return "O(n)";
  if (depth === 2) return "O(n^2)";
  if (depth === 3) return "O(n^3)";
  return "unknown";
}

export function formatComplexityList(
  complexities: Record<string, number>,
): string {
  return COMPLEXITY_ORDER.filter((c) => complexities[c])
    .map((c) => `${c}: ${complexities[c]}`)
    .join(", ");
}
