import type { BigOComplexity } from "../../analyzer/types.js";

export interface MethodComplexity {
  pattern: string;
  complexity: BigOComplexity;
}

export const KNOWN_METHODS: MethodComplexity[] = [
  // O(n log n)
  { pattern: ".sort", complexity: "O(n log n)" },

  // O(n) — List / Iterable methods
  { pattern: ".indexOf", complexity: "O(n)" },
  { pattern: ".lastIndexOf", complexity: "O(n)" },
  { pattern: ".contains", complexity: "O(n)" },
  { pattern: ".where", complexity: "O(n)" },
  { pattern: ".map", complexity: "O(n)" },
  { pattern: ".forEach", complexity: "O(n)" },
  { pattern: ".reduce", complexity: "O(n)" },
  { pattern: ".fold", complexity: "O(n)" },
  { pattern: ".any", complexity: "O(n)" },
  { pattern: ".every", complexity: "O(n)" },
  { pattern: ".expand", complexity: "O(n)" },
  { pattern: ".take", complexity: "O(n)" },
  { pattern: ".skip", complexity: "O(n)" },
  { pattern: ".toList", complexity: "O(n)" },
  { pattern: ".toSet", complexity: "O(n)" },
  { pattern: ".join", complexity: "O(n)" },
  { pattern: ".fillRange", complexity: "O(n)" },
  { pattern: ".setAll", complexity: "O(n)" },
  { pattern: ".sublist", complexity: "O(n)" },
  { pattern: ".reversed", complexity: "O(n)" },
  { pattern: ".firstWhere", complexity: "O(n)" },
  { pattern: ".lastWhere", complexity: "O(n)" },
  { pattern: ".singleWhere", complexity: "O(n)" },

  // O(1) — constant-time operations
  { pattern: ".add", complexity: "O(1)" },
  { pattern: ".removeLast", complexity: "O(1)" },
  { pattern: ".first", complexity: "O(1)" },
  { pattern: ".last", complexity: "O(1)" },
  { pattern: ".isEmpty", complexity: "O(1)" },
  { pattern: ".isNotEmpty", complexity: "O(1)" },
  { pattern: ".length", complexity: "O(1)" },
  { pattern: ".elementAt", complexity: "O(1)" },

  // O(n) — Set / Map methods
  { pattern: ".addAll", complexity: "O(n)" },
  { pattern: ".removeAll", complexity: "O(n)" },
  { pattern: ".retainAll", complexity: "O(n)" },
  { pattern: ".intersection", complexity: "O(n)" },
  { pattern: ".difference", complexity: "O(n)" },
  { pattern: ".union", complexity: "O(n)" },

  // O(1) — Map operations
  { pattern: ".putIfAbsent", complexity: "O(1)" },
  { pattern: ".remove", complexity: "O(1)" },
  { pattern: ".containsKey", complexity: "O(1)" },

  // O(n) — Map iteration
  { pattern: ".containsValue", complexity: "O(n)" },
];
