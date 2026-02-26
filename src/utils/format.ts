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

export function highestComplexity(
  functions: FunctionComplexity[],
): BigOComplexity {
  if (functions.length === 0) return "O(1)";

  const order: BigOComplexity[] = [
    "O(1)",
    "O(log n)",
    "O(n)",
    "O(n log n)",
    "O(n^2)",
    "O(n^3)",
    "O(2^n)",
    "O(n!)",
    "unknown",
  ];

  let highest: BigOComplexity = "O(1)";
  for (const fn of functions) {
    if (order.indexOf(fn.complexity) > order.indexOf(highest)) {
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
