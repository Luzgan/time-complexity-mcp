import type { BigOComplexity } from "../../analyzer/types.js";

export interface MethodComplexity {
  pattern: string;
  complexity: BigOComplexity;
}

export const KNOWN_METHODS: MethodComplexity[] = [
  // O(n log n)
  { pattern: ".sort", complexity: "O(n log n)" },
  { pattern: ".sorted", complexity: "O(n log n)" },
  { pattern: ".sortedBy", complexity: "O(n log n)" },
  { pattern: ".sortedByDescending", complexity: "O(n log n)" },
  { pattern: ".sortedDescending", complexity: "O(n log n)" },
  { pattern: ".sortedWith", complexity: "O(n log n)" },
  { pattern: ".sortBy", complexity: "O(n log n)" },
  { pattern: ".sortWith", complexity: "O(n log n)" },

  // O(n)
  { pattern: ".map", complexity: "O(n)" },
  { pattern: ".flatMap", complexity: "O(n)" },
  { pattern: ".filter", complexity: "O(n)" },
  { pattern: ".filterNot", complexity: "O(n)" },
  { pattern: ".forEach", complexity: "O(n)" },
  { pattern: ".forEachIndexed", complexity: "O(n)" },
  { pattern: ".reduce", complexity: "O(n)" },
  { pattern: ".fold", complexity: "O(n)" },
  { pattern: ".any", complexity: "O(n)" },
  { pattern: ".all", complexity: "O(n)" },
  { pattern: ".none", complexity: "O(n)" },
  { pattern: ".count", complexity: "O(n)" },
  { pattern: ".find", complexity: "O(n)" },
  { pattern: ".findLast", complexity: "O(n)" },
  { pattern: ".first", complexity: "O(n)" },
  { pattern: ".last", complexity: "O(n)" },
  { pattern: ".indexOf", complexity: "O(n)" },
  { pattern: ".lastIndexOf", complexity: "O(n)" },
  { pattern: ".contains", complexity: "O(n)" },
  { pattern: ".toList", complexity: "O(n)" },
  { pattern: ".toSet", complexity: "O(n)" },
  { pattern: ".toMap", complexity: "O(n)" },
  { pattern: ".reversed", complexity: "O(n)" },
  { pattern: ".zip", complexity: "O(n)" },
  { pattern: ".joinToString", complexity: "O(n)" },
  { pattern: ".sum", complexity: "O(n)" },
  { pattern: ".sumOf", complexity: "O(n)" },
  { pattern: ".maxOrNull", complexity: "O(n)" },
  { pattern: ".minOrNull", complexity: "O(n)" },
  { pattern: ".distinct", complexity: "O(n)" },
  { pattern: ".take", complexity: "O(n)" },
  { pattern: ".drop", complexity: "O(n)" },
  { pattern: ".associateBy", complexity: "O(n)" },
  { pattern: ".groupBy", complexity: "O(n)" },

  // O(1)
  { pattern: ".add", complexity: "O(1)" },
  { pattern: ".get", complexity: "O(1)" },
  { pattern: ".size", complexity: "O(1)" },
  { pattern: ".isEmpty", complexity: "O(1)" },
  { pattern: ".isNotEmpty", complexity: "O(1)" },
  { pattern: ".removeAt", complexity: "O(1)" },
  { pattern: ".removeLast", complexity: "O(1)" },
];
