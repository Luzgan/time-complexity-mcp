import { z } from "zod";
import { findSourceFiles } from "../utils/file-utils.js";
import { analyzeFile } from "./analyze-file.js";
import { highestComplexity, groupByComplexity, COMPLEXITY_RANK } from "../utils/format.js";
import type { BigOComplexity, DirectoryAnalysisResult } from "../analyzer/types.js";

export const analyzeDirectorySchema = z.object({
  directory_path: z
    .string()
    .describe("Absolute path to the directory to scan"),
  recursive: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to scan subdirectories"),
  include_patterns: z
    .array(z.string())
    .optional()
    .describe("Glob patterns for files to include, e.g. ['**/*.ts', '**/*.js']"),
  exclude_patterns: z
    .array(z.string())
    .optional()
    .default(["**/node_modules/**", "**/dist/**", "**/.git/**"])
    .describe("Glob patterns for files to exclude"),
  max_files: z
    .number()
    .optional()
    .default(50)
    .describe("Maximum number of files to analyze (safety limit)"),
});

export type AnalyzeDirectoryInput = z.infer<typeof analyzeDirectorySchema>;

export async function analyzeDirectory(
  input: AnalyzeDirectoryInput,
): Promise<DirectoryAnalysisResult> {
  const {
    directory_path,
    recursive,
    include_patterns,
    exclude_patterns,
    max_files,
  } = input;

  const { files, skipped } = await findSourceFiles(directory_path, {
    recursive,
    includePatterns: include_patterns,
    excludePatterns: exclude_patterns,
    maxFiles: max_files,
  });

  const results: DirectoryAnalysisResult["results"] = [];
  const allFunctions: Array<{
    filePath: string;
    name: string;
    complexity: BigOComplexity;
    line: number;
  }> = [];

  for (const file of files) {
    try {
      const fileResult = await analyzeFile({ file_path: file });
      results.push({
        filePath: fileResult.filePath,
        language: fileResult.language,
        functionCount: fileResult.functions.length,
        highestComplexity: fileResult.summary.highestComplexity,
        functions: fileResult.functions.map((fn) => ({
          name: fn.name,
          complexity: fn.complexity,
          line: fn.startLine,
        })),
      });

      for (const fn of fileResult.functions) {
        allFunctions.push({
          filePath: file,
          name: fn.name,
          complexity: fn.complexity,
          line: fn.startLine,
        });
      }
    } catch {
      // Skip files that fail to parse
    }
  }

  // Sort by complexity to find hotspots
  const hotspots = [...allFunctions]
    .sort(
      (a, b) =>
        (COMPLEXITY_RANK.get(b.complexity) ?? 0) -
        (COMPLEXITY_RANK.get(a.complexity) ?? 0),
    )
    .slice(0, 5)
    .map((fn) => ({
      filePath: fn.filePath,
      functionName: fn.name,
      complexity: fn.complexity,
      line: fn.line,
    }));

  const allComplexities = allFunctions.map((fn) => ({
    complexity: fn.complexity,
    name: fn.name,
    startLine: fn.line,
    endLine: fn.line,
    reasoning: "",
    loops: [],
    isRecursive: false,
    knownComplexityCalls: [],
    lineAnnotations: [],
  }));

  return {
    directory: directory_path,
    filesAnalyzed: files.length,
    filesSkipped: skipped,
    results,
    summary: {
      totalFunctions: allFunctions.length,
      functionsByComplexity: groupByComplexity(allComplexities),
      hotspots,
    },
  };
}
