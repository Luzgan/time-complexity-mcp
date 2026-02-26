import type { BigOComplexity } from "../../analyzer/types.js";

export interface MethodComplexity {
  pattern: string;
  complexity: BigOComplexity;
}

export const KNOWN_METHODS: MethodComplexity[] = [
  // O(n log n)
  { pattern: "Collections.sort", complexity: "O(n log n)" },
  { pattern: "Arrays.sort", complexity: "O(n log n)" },
  { pattern: ".sort", complexity: "O(n log n)" },
  { pattern: ".sorted", complexity: "O(n log n)" },

  // O(n) — Collection / Stream methods
  { pattern: ".stream", complexity: "O(n)" },
  { pattern: ".parallelStream", complexity: "O(n)" },
  { pattern: ".map", complexity: "O(n)" },
  { pattern: ".filter", complexity: "O(n)" },
  { pattern: ".forEach", complexity: "O(n)" },
  { pattern: ".reduce", complexity: "O(n)" },
  { pattern: ".collect", complexity: "O(n)" },
  { pattern: ".flatMap", complexity: "O(n)" },
  { pattern: ".anyMatch", complexity: "O(n)" },
  { pattern: ".allMatch", complexity: "O(n)" },
  { pattern: ".noneMatch", complexity: "O(n)" },
  { pattern: ".findFirst", complexity: "O(n)" },
  { pattern: ".findAny", complexity: "O(n)" },
  { pattern: ".toArray", complexity: "O(n)" },
  { pattern: ".contains", complexity: "O(n)" },
  { pattern: ".containsAll", complexity: "O(n)" },
  { pattern: ".indexOf", complexity: "O(n)" },
  { pattern: ".lastIndexOf", complexity: "O(n)" },
  { pattern: ".addAll", complexity: "O(n)" },
  { pattern: ".removeAll", complexity: "O(n)" },
  { pattern: ".retainAll", complexity: "O(n)" },
  { pattern: "Arrays.copyOf", complexity: "O(n)" },
  { pattern: "Arrays.fill", complexity: "O(n)" },
  { pattern: "Collections.reverse", complexity: "O(n)" },
  { pattern: "Collections.copy", complexity: "O(n)" },

  // O(1)
  { pattern: ".add", complexity: "O(1)" },
  { pattern: ".get", complexity: "O(1)" },
  { pattern: ".set", complexity: "O(1)" },
  { pattern: ".size", complexity: "O(1)" },
  { pattern: ".isEmpty", complexity: "O(1)" },
  { pattern: ".peek", complexity: "O(1)" },
  { pattern: ".push", complexity: "O(1)" },
  { pattern: ".pop", complexity: "O(1)" },
  { pattern: ".put", complexity: "O(1)" },
  { pattern: ".containsKey", complexity: "O(1)" },
];
