import type { KnownMethodComplexity } from "../../analyzer/base-analyzer.js";
import type { BigOComplexity } from "../../analyzer/types.js";

const nLogN: BigOComplexity = "O(n log n)";
const linear: BigOComplexity = "O(n)";
const constant: BigOComplexity = "O(1)";

export const KNOWN_METHODS: KnownMethodComplexity[] = [
  // O(n log n) — sorting
  { pattern: "sort.Ints", complexity: nLogN },
  { pattern: "sort.Strings", complexity: nLogN },
  { pattern: "sort.Float64s", complexity: nLogN },
  { pattern: "sort.Sort", complexity: nLogN },
  { pattern: "sort.Slice", complexity: nLogN },
  { pattern: "sort.SliceStable", complexity: nLogN },
  { pattern: "slices.Sort", complexity: nLogN },
  { pattern: "slices.SortFunc", complexity: nLogN },

  // O(n) — iteration / search
  { pattern: "strings.Contains", complexity: linear },
  { pattern: "strings.Split", complexity: linear },
  { pattern: "strings.Join", complexity: linear },
  { pattern: "strings.Replace", complexity: linear },
  { pattern: "strings.ReplaceAll", complexity: linear },
  { pattern: "strings.Count", complexity: linear },
  { pattern: "strings.Map", complexity: linear },
  { pattern: "strings.Repeat", complexity: linear },
  { pattern: "bytes.Contains", complexity: linear },
  { pattern: "bytes.Split", complexity: linear },
  { pattern: "bytes.Join", complexity: linear },
  { pattern: "copy", complexity: linear },
  { pattern: "slices.Contains", complexity: linear },
  { pattern: "slices.Index", complexity: linear },

  // O(1) — builtins
  { pattern: "len", complexity: constant },
  { pattern: "cap", complexity: constant },
  { pattern: "append", complexity: constant },
  { pattern: "make", complexity: constant },
  { pattern: "new", complexity: constant },
  { pattern: "delete", complexity: constant },
];
