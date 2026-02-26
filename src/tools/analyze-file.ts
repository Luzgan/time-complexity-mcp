import { z } from "zod";
import { readFile } from "../utils/file-utils.js";
import { getAnalyzerForFile } from "../languages/index.js";
import { formatFileResult, highestComplexity, groupByComplexity } from "../utils/format.js";
import type { FileAnalysisResult } from "../analyzer/types.js";

export const analyzeFileSchema = z.object({
  file_path: z.string().describe("Absolute path to the file to analyze"),
});

export type AnalyzeFileInput = z.infer<typeof analyzeFileSchema>;

export async function analyzeFile(
  input: AnalyzeFileInput,
): Promise<FileAnalysisResult> {
  const { file_path } = input;

  const analyzer = getAnalyzerForFile(file_path);
  if (!analyzer) {
    throw new Error(
      `Unsupported file type: ${file_path}. Use get_supported_languages to see supported extensions.`,
    );
  }

  const sourceCode = await readFile(file_path);
  const parsed = analyzer.parse(sourceCode);
  const functions = analyzer.extractFunctions(parsed);
  const results = functions.map((fn) => analyzer.analyzeFunction(fn, parsed));

  return {
    filePath: file_path,
    language: analyzer.language,
    functions: results,
    summary: {
      totalFunctions: results.length,
      highestComplexity: highestComplexity(results),
      functionsByComplexity: groupByComplexity(results),
    },
  };
}

export function formatAnalyzeFileResult(result: FileAnalysisResult): string {
  return formatFileResult(result);
}
