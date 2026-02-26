import { z } from "zod";
import { readFile } from "../utils/file-utils.js";
import { getAnalyzerForFile } from "../languages/index.js";
import { formatFunctionResult } from "../utils/format.js";
import type { FunctionComplexity } from "../analyzer/types.js";

export const analyzeFunctionSchema = z
  .object({
    file_path: z.string().describe("Absolute path to the file"),
    function_name: z
      .string()
      .optional()
      .describe("Name of the function to analyze"),
    line_number: z
      .number()
      .optional()
      .describe("Line number within the function body"),
  })
  .refine((data) => data.function_name || data.line_number, {
    message: "Either function_name or line_number must be provided",
  });

export type AnalyzeFunctionInput = z.infer<typeof analyzeFunctionSchema>;

export async function analyzeFunction(
  input: AnalyzeFunctionInput,
): Promise<FunctionComplexity> {
  const { file_path, function_name, line_number } = input;

  const analyzer = getAnalyzerForFile(file_path);
  if (!analyzer) {
    throw new Error(`Unsupported file type: ${file_path}.`);
  }

  const sourceCode = await readFile(file_path);
  const parsed = analyzer.parse(sourceCode);
  const functions = analyzer.extractFunctions(parsed);

  let target;

  if (function_name) {
    target = functions.find((fn) => fn.name === function_name);
    if (!target) {
      const available = functions.map((fn) => fn.name).join(", ");
      throw new Error(
        `Function "${function_name}" not found. Available functions: ${available}`,
      );
    }
  } else if (line_number) {
    target = functions.find(
      (fn) => line_number >= fn.startLine && line_number <= fn.endLine,
    );
    if (!target) {
      throw new Error(
        `No function found at line ${line_number}. Functions in file: ${functions.map((fn) => `${fn.name} (${fn.startLine}-${fn.endLine})`).join(", ")}`,
      );
    }
  }

  if (!target) {
    throw new Error("Either function_name or line_number must be provided.");
  }

  return analyzer.analyzeFunction(target, parsed);
}

export function formatAnalyzeFunctionResult(
  result: FunctionComplexity,
): string {
  return formatFunctionResult(result);
}
