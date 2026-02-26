import type {
  BigOComplexity,
  FileAnalysisResult,
  FunctionComplexity,
} from "../analyzer/types.js";

export function formatFileResult(result: FileAnalysisResult): string {
  const lines: string[] = [];
  lines.push(`## ${result.filePath}`);
  lines.push(`Language: ${result.language}`);
  lines.push(`Functions: ${result.summary.totalFunctions}`);
  lines.push(`Highest complexity: ${result.summary.highestComplexity}`);
  lines.push("");

  for (const fn of result.functions) {
    lines.push(formatFunctionResult(fn));
    lines.push("");
  }

  return lines.join("\n");
}

export function formatFunctionResult(fn: FunctionComplexity): string {
  const lines: string[] = [];
  lines.push(
    `### ${fn.name} (lines ${fn.startLine}-${fn.endLine}): ${fn.complexity}`,
  );
  lines.push(fn.reasoning);

  if (fn.lineAnnotations.length > 0) {
    lines.push("");
    lines.push("Line annotations:");
    for (const ann of fn.lineAnnotations) {
      lines.push(`  Line ${ann.line}: ${ann.complexity} — ${ann.note}`);
    }
  }

  return lines.join("\n");
}

export const COMPLEXITY_RANK = new Map<BigOComplexity, number>([
  ["O(1)", 0],
  ["O(log n)", 1],
  ["O(n)", 2],
  ["O(n log n)", 3],
  ["O(n^2)", 4],
  ["O(n^3)", 5],
  ["O(2^n)", 6],
  ["O(n!)", 7],
  ["unknown", 8],
]);

export function highestComplexity(
  functions: FunctionComplexity[],
): BigOComplexity {
  if (functions.length === 0) return "O(1)";

  let highest: BigOComplexity = "O(1)";
  for (const fn of functions) {
    if ((COMPLEXITY_RANK.get(fn.complexity) ?? 0) > (COMPLEXITY_RANK.get(highest) ?? 0)) {
      highest = fn.complexity;
    }
  }
  return highest;
}

export function groupByComplexity(
  functions: FunctionComplexity[],
): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const fn of functions) {
    groups[fn.complexity] = (groups[fn.complexity] ?? 0) + 1;
  }
  return groups;
}
