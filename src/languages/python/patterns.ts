import type { BigOComplexity } from "../../analyzer/types.js";

export interface MethodComplexity {
  pattern: string;
  complexity: BigOComplexity;
}

export const KNOWN_METHODS: MethodComplexity[] = [
  // O(n log n)
  { pattern: ".sort", complexity: "O(n log n)" },
  { pattern: "sorted", complexity: "O(n log n)" },

  // O(n) — built-in functions and methods
  { pattern: "sum", complexity: "O(n)" },
  { pattern: "max", complexity: "O(n)" },
  { pattern: "min", complexity: "O(n)" },
  { pattern: "any", complexity: "O(n)" },
  { pattern: "all", complexity: "O(n)" },
  { pattern: "map", complexity: "O(n)" },
  { pattern: "filter", complexity: "O(n)" },
  { pattern: "list", complexity: "O(n)" },
  { pattern: "set", complexity: "O(n)" },
  { pattern: "tuple", complexity: "O(n)" },
  { pattern: "dict", complexity: "O(n)" },
  { pattern: "enumerate", complexity: "O(n)" },
  { pattern: "zip", complexity: "O(n)" },
  { pattern: "reversed", complexity: "O(n)" },
  { pattern: ".join", complexity: "O(n)" },
  { pattern: ".index", complexity: "O(n)" },
  { pattern: ".count", complexity: "O(n)" },
  { pattern: ".copy", complexity: "O(n)" },
  { pattern: ".extend", complexity: "O(n)" },
  { pattern: ".reverse", complexity: "O(n)" },
  { pattern: ".values", complexity: "O(n)" },
  { pattern: ".keys", complexity: "O(n)" },
  { pattern: ".items", complexity: "O(n)" },

  // O(1)
  { pattern: ".append", complexity: "O(1)" },
  { pattern: ".pop", complexity: "O(1)" },
  { pattern: ".get", complexity: "O(1)" },
  { pattern: "len", complexity: "O(1)" },
  { pattern: ".add", complexity: "O(1)" },
  { pattern: ".discard", complexity: "O(1)" },
];
