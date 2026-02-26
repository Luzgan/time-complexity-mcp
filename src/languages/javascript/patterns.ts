import type { BigOComplexity } from "../../analyzer/types.js";

export interface MethodComplexity {
  pattern: string;
  complexity: BigOComplexity;
}

export const KNOWN_METHODS: MethodComplexity[] = [
  // O(n log n)
  { pattern: ".sort", complexity: "O(n log n)" },

  // O(n)
  { pattern: ".indexOf", complexity: "O(n)" },
  { pattern: ".lastIndexOf", complexity: "O(n)" },
  { pattern: ".includes", complexity: "O(n)" },
  { pattern: ".find", complexity: "O(n)" },
  { pattern: ".findIndex", complexity: "O(n)" },
  { pattern: ".findLast", complexity: "O(n)" },
  { pattern: ".findLastIndex", complexity: "O(n)" },
  { pattern: ".some", complexity: "O(n)" },
  { pattern: ".every", complexity: "O(n)" },
  { pattern: ".map", complexity: "O(n)" },
  { pattern: ".filter", complexity: "O(n)" },
  { pattern: ".reduce", complexity: "O(n)" },
  { pattern: ".reduceRight", complexity: "O(n)" },
  { pattern: ".forEach", complexity: "O(n)" },
  { pattern: ".flat", complexity: "O(n)" },
  { pattern: ".flatMap", complexity: "O(n)" },
  { pattern: ".fill", complexity: "O(n)" },
  { pattern: ".copyWithin", complexity: "O(n)" },
  { pattern: ".join", complexity: "O(n)" },
  { pattern: ".reverse", complexity: "O(n)" },
  { pattern: ".slice", complexity: "O(n)" },
  { pattern: ".splice", complexity: "O(n)" },
  { pattern: ".concat", complexity: "O(n)" },

  // O(1)
  { pattern: ".push", complexity: "O(1)" },
  { pattern: ".pop", complexity: "O(1)" },
  { pattern: ".has", complexity: "O(1)" },
  { pattern: ".get", complexity: "O(1)" },
  { pattern: ".set", complexity: "O(1)" },
  { pattern: ".delete", complexity: "O(1)" },
  { pattern: ".add", complexity: "O(1)" },
];
