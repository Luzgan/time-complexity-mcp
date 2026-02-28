import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { analyzeFileSchema, analyzeFile } from "./tools/analyze-file.js";
import { analyzeFunction } from "./tools/analyze-function.js";
import { analyzeDirectorySchema, analyzeDirectory } from "./tools/analyze-directory.js";
import { getSupportedLanguagesSchema, getSupportedLanguages } from "./tools/get-supported-languages.js";
import { analyzeGithubRepoSchema, analyzeGithubRepo } from "./tools/analyze-github-repo.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "time-complexity",
    version: "0.1.0",
  });

  server.tool(
    "analyze_file",
    "Analyze an entire source file for time complexity. Returns per-function Big-O complexity with line annotations.",
    analyzeFileSchema.shape,
    async ({ file_path }) => {
      const result = await analyzeFile({ file_path });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "analyze_function",
    "Analyze a specific function for time complexity. Provide either function_name or line_number to locate it.",
    {
      file_path: z.string().describe("Absolute path to the file"),
      function_name: z.string().optional().describe("Name of the function to analyze"),
      line_number: z.number().optional().describe("Line number within the function body"),
    },
    async ({ file_path, function_name, line_number }) => {
      const result = await analyzeFunction({ file_path, function_name, line_number });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "analyze_directory",
    "Scan a directory for all supported source files and report complexity across the codebase. Returns a summary with hotspots.",
    analyzeDirectorySchema.shape,
    async (input) => {
      const result = await analyzeDirectory(input);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "get_supported_languages",
    "List programming languages supported for complexity analysis, with their file extensions and detection capabilities.",
    getSupportedLanguagesSchema.shape,
    async () => {
      const result = getSupportedLanguages();
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.tool(
    "analyze_github_repo",
    "Clone a GitHub repository and analyze complexity across the codebase. Accepts full URL (https://github.com/owner/repo) or shorthand (owner/repo). Requires git in PATH. Returns per-file complexity with hotspots, plus repository metadata.",
    analyzeGithubRepoSchema.shape,
    async (input) => {
      const result = await analyzeGithubRepo(input);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  return server;
}
