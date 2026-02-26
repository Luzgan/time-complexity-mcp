import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { getSupportedExtensions } from "../languages/index.js";

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

export async function findSourceFiles(
  directory: string,
  options: {
    recursive?: boolean;
    includePatterns?: string[];
    excludePatterns?: string[];
    maxFiles?: number;
  } = {},
): Promise<{ files: string[]; skipped: number }> {
  const {
    recursive = true,
    includePatterns,
    excludePatterns = ["**/node_modules/**", "**/dist/**", "**/.git/**"],
    maxFiles = 50,
  } = options;

  const extensions = getSupportedExtensions();
  const patterns =
    includePatterns ??
    extensions.map((ext) => (recursive ? `**/*${ext}` : `*${ext}`));

  const allFiles: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: directory,
      absolute: true,
      ignore: excludePatterns,
      nodir: true,
    });
    allFiles.push(...matches);
  }

  // Deduplicate and sort
  const unique = [...new Set(allFiles)].sort();
  const skipped = Math.max(0, unique.length - maxFiles);

  return {
    files: unique.slice(0, maxFiles),
    skipped,
  };
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}
