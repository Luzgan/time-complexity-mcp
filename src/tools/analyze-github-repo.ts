import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { analyzeDirectory } from "./analyze-directory.js";
import type { GithubRepoAnalysisResult } from "../analyzer/types.js";

const execFileAsync = promisify(execFile);

export const analyzeGithubRepoSchema = z.object({
  repository: z
    .string()
    .describe(
      "GitHub repository — full URL (https://github.com/owner/repo) or shorthand (owner/repo)",
    ),
  ref: z
    .string()
    .optional()
    .describe(
      "Branch, tag, or commit SHA to analyze. Defaults to the repository's default branch",
    ),
  subdirectory: z
    .string()
    .optional()
    .describe(
      "Subdirectory within the repo to analyze (e.g. 'src' or 'lib'). Defaults to repo root",
    ),
  include_patterns: z
    .array(z.string())
    .optional()
    .describe(
      "Glob patterns for files to include, e.g. ['**/*.ts', '**/*.js']",
    ),
  exclude_patterns: z
    .array(z.string())
    .optional()
    .default([
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/vendor/**",
      "**/build/**",
    ])
    .describe("Glob patterns for files to exclude"),
  max_files: z
    .number()
    .optional()
    .default(50)
    .describe("Maximum number of files to analyze (safety limit)"),
});

export type AnalyzeGithubRepoInput = z.infer<typeof analyzeGithubRepoSchema>;

export interface ParsedRepo {
  owner: string;
  name: string;
  cloneUrl: string;
}

export function parseRepository(input: string): ParsedRepo {
  // Strip trailing slashes and .git suffix
  let cleaned = input.replace(/\/+$/, "").replace(/\.git$/, "");

  // Pattern 1: Full URL — https://github.com/owner/repo
  const urlMatch = cleaned.match(
    /^https?:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/,
  );
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      name: urlMatch[2],
      cloneUrl: `https://github.com/${urlMatch[1]}/${urlMatch[2]}.git`,
    };
  }

  // Pattern 2: Shorthand — owner/repo
  const shortMatch = cleaned.match(
    /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/,
  );
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      name: shortMatch[2],
      cloneUrl: `https://github.com/${shortMatch[1]}/${shortMatch[2]}.git`,
    };
  }

  throw new Error(
    `Invalid repository format: "${input}". Expected "owner/repo" or "https://github.com/owner/repo".`,
  );
}

export async function cloneAndAnalyze(
  cloneUrl: string,
  owner: string,
  name: string,
  options: {
    ref?: string;
    subdirectory?: string;
    include_patterns?: string[];
    exclude_patterns: string[];
    max_files: number;
  },
): Promise<GithubRepoAnalysisResult> {
  const { ref, subdirectory, include_patterns, exclude_patterns, max_files } =
    options;

  // Verify git is available
  try {
    await execFileAsync("git", ["--version"]);
  } catch {
    throw new Error(
      "git is not installed or not in PATH. Install git to use analyze_github_repo.",
    );
  }

  // Create temp directory
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tc-mcp-"));

  try {
    // Shallow clone
    const cloneArgs = ["clone", "--depth", "1", "--single-branch"];
    if (ref) {
      cloneArgs.push("--branch", ref);
    }
    cloneArgs.push("--", cloneUrl, tmpDir);

    try {
      await execFileAsync("git", cloneArgs, {
        timeout: 60_000,
        maxBuffer: 10_000_000,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (ref && message.includes("not found")) {
        throw new Error(
          `Branch or tag "${ref}" not found in ${owner}/${name}.`,
        );
      }
      throw new Error(`Failed to clone ${owner}/${name}: ${message}`);
    }

    // Determine analysis directory
    let analysisDir = tmpDir;
    if (subdirectory) {
      analysisDir = path.join(tmpDir, subdirectory);
      try {
        const stat = await fs.stat(analysisDir);
        if (!stat.isDirectory()) {
          throw new Error(
            `"${subdirectory}" exists in ${owner}/${name} but is not a directory.`,
          );
        }
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          throw new Error(
            `Subdirectory "${subdirectory}" not found in ${owner}/${name}.`,
          );
        }
        throw err;
      }
    }

    // Run analysis
    const directoryResult = await analyzeDirectory({
      directory_path: analysisDir,
      recursive: true,
      include_patterns,
      exclude_patterns,
      max_files,
    });

    // Relativize file paths (strip temp dir prefix → repo-relative)
    const repoPrefix = tmpDir + path.sep;
    const relativize = (p: string) =>
      p.startsWith(repoPrefix) ? p.slice(repoPrefix.length) : p;

    const result: GithubRepoAnalysisResult = {
      ...directoryResult,
      directory: subdirectory
        ? `${owner}/${name}/${subdirectory}`
        : `${owner}/${name}`,
      results: directoryResult.results.map((r) => ({
        ...r,
        filePath: relativize(r.filePath),
      })),
      summary: {
        ...directoryResult.summary,
        hotspots: directoryResult.summary.hotspots.map((h) => ({
          ...h,
          filePath: relativize(h.filePath),
        })),
      },
      repository: {
        owner,
        name,
        ref: ref ?? null,
        url: `https://github.com/${owner}/${name}`,
        clonedAt: new Date().toISOString(),
      },
    };

    return result;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {
      // Swallow cleanup errors — the analysis result is what matters
    });
  }
}

export async function analyzeGithubRepo(
  input: AnalyzeGithubRepoInput,
): Promise<GithubRepoAnalysisResult> {
  const {
    repository,
    ref,
    subdirectory,
    include_patterns,
    exclude_patterns,
    max_files,
  } = input;

  const parsed = parseRepository(repository);

  return cloneAndAnalyze(parsed.cloneUrl, parsed.owner, parsed.name, {
    ref,
    subdirectory,
    include_patterns,
    exclude_patterns,
    max_files,
  });
}
