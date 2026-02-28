import type { KnownMethodComplexity } from "../../analyzer/base-analyzer.js";
import type { BigOComplexity } from "../../analyzer/types.js";

const nLogN: BigOComplexity = "O(n log n)";
const linear: BigOComplexity = "O(n)";
const constant: BigOComplexity = "O(1)";

export const KNOWN_METHODS: KnownMethodComplexity[] = [
  // O(n log n) — sorting
  { pattern: "sort", complexity: nLogN },
  { pattern: "asort", complexity: nLogN },
  { pattern: "arsort", complexity: nLogN },
  { pattern: "ksort", complexity: nLogN },
  { pattern: "krsort", complexity: nLogN },
  { pattern: "rsort", complexity: nLogN },
  { pattern: "usort", complexity: nLogN },
  { pattern: "uasort", complexity: nLogN },
  { pattern: "uksort", complexity: nLogN },
  { pattern: "array_unique", complexity: nLogN },
  { pattern: "array_multisort", complexity: nLogN },

  // O(n) — iteration / search
  { pattern: "array_map", complexity: linear },
  { pattern: "array_filter", complexity: linear },
  { pattern: "array_reduce", complexity: linear },
  { pattern: "array_walk", complexity: linear },
  { pattern: "array_search", complexity: linear },
  { pattern: "in_array", complexity: linear },
  { pattern: "array_merge", complexity: linear },
  { pattern: "array_reverse", complexity: linear },
  { pattern: "array_slice", complexity: linear },
  { pattern: "array_splice", complexity: linear },
  { pattern: "array_keys", complexity: linear },
  { pattern: "array_values", complexity: linear },
  { pattern: "array_flip", complexity: linear },
  { pattern: "array_combine", complexity: linear },
  { pattern: "array_diff", complexity: linear },
  { pattern: "array_intersect", complexity: linear },
  { pattern: "array_count_values", complexity: linear },
  { pattern: "implode", complexity: linear },
  { pattern: "explode", complexity: linear },
  { pattern: "str_split", complexity: linear },
  { pattern: "preg_match_all", complexity: linear },
  { pattern: "array_sum", complexity: linear },
  { pattern: "array_product", complexity: linear },

  // O(1) — direct access / metadata
  { pattern: "count", complexity: constant },
  { pattern: "sizeof", complexity: constant },
  { pattern: "array_push", complexity: constant },
  { pattern: "array_pop", complexity: constant },
  { pattern: "array_key_exists", complexity: constant },
  { pattern: "isset", complexity: constant },
  { pattern: "empty", complexity: constant },
  { pattern: "array_key_first", complexity: constant },
  { pattern: "array_key_last", complexity: constant },
];
