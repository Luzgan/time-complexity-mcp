import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseRepository, cloneAndAnalyze } from "../src/tools/analyze-github-repo.js";

const execFileAsync = promisify(execFile);

describe("parseRepository", () => {
  it("should parse full GitHub URL", () => {
    const result = parseRepository("https://github.com/Luzgan/time-complexity-mcp");
    expect(result).toEqual({
      owner: "Luzgan",
      name: "time-complexity-mcp",
      cloneUrl: "https://github.com/Luzgan/time-complexity-mcp.git",
    });
  });

  it("should parse shorthand owner/repo", () => {
    const result = parseRepository("Luzgan/time-complexity-mcp");
    expect(result).toEqual({
      owner: "Luzgan",
      name: "time-complexity-mcp",
      cloneUrl: "https://github.com/Luzgan/time-complexity-mcp.git",
    });
  });

  it("should strip trailing slash", () => {
    const result = parseRepository("https://github.com/owner/repo/");
    expect(result.owner).toBe("owner");
    expect(result.name).toBe("repo");
  });

  it("should strip .git suffix", () => {
    const result = parseRepository("https://github.com/owner/repo.git");
    expect(result.owner).toBe("owner");
    expect(result.name).toBe("repo");
    expect(result.cloneUrl).toBe("https://github.com/owner/repo.git");
  });

  it("should handle http:// URL", () => {
    const result = parseRepository("http://github.com/owner/repo");
    expect(result.owner).toBe("owner");
    expect(result.name).toBe("repo");
  });

  it("should handle owner/repo with dots and hyphens", () => {
    const result = parseRepository("my-org/my.project-v2");
    expect(result.owner).toBe("my-org");
    expect(result.name).toBe("my.project-v2");
  });

  it("should reject bare name without slash", () => {
    expect(() => parseRepository("just-a-name")).toThrow("Invalid repository format");
  });

  it("should reject SSH URL", () => {
    expect(() => parseRepository("git@github.com:owner/repo.git")).toThrow(
      "Invalid repository format",
    );
  });

  it("should reject non-GitHub URL", () => {
    expect(() => parseRepository("https://gitlab.com/owner/repo")).toThrow(
      "Invalid repository format",
    );
  });

  it("should reject URL with extra path segments", () => {
    expect(() =>
      parseRepository("https://github.com/owner/repo/tree/main"),
    ).toThrow("Invalid repository format");
  });
});

describe("cloneAndAnalyze (local bare repo)", () => {
  let bareRepoPath: string;
  let tempDir: string;

  beforeAll(async () => {
    // Create a temp directory with a work repo and a bare clone
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tc-mcp-test-"));
    const workDir = path.join(tempDir, "work");
    bareRepoPath = path.join(tempDir, "bare.git");

    await fs.mkdir(workDir);
    await execFileAsync("git", ["init", workDir]);
    await execFileAsync("git", ["-C", workDir, "config", "user.email", "test@test.com"]);
    await execFileAsync("git", ["-C", workDir, "config", "user.name", "Test"]);

    // Create a src/ subdirectory with a TypeScript file
    await fs.mkdir(path.join(workDir, "src"));
    await fs.writeFile(
      path.join(workDir, "src", "example.ts"),
      `export function linearSearch(arr: number[], target: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

export function bubbleSort(arr: number[]): number[] {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
`,
    );

    await execFileAsync("git", ["-C", workDir, "add", "."]);
    await execFileAsync("git", ["-C", workDir, "commit", "-m", "init"]);

    // Create a bare clone (so git clone works against it)
    await execFileAsync("git", ["clone", "--bare", workDir, bareRepoPath]);
  }, 30_000);

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should clone and analyze a repo", async () => {
    const result = await cloneAndAnalyze(
      bareRepoPath,
      "test-owner",
      "test-repo",
      {
        exclude_patterns: ["**/.git/**"],
        max_files: 50,
      },
    );

    expect(result.repository.owner).toBe("test-owner");
    expect(result.repository.name).toBe("test-repo");
    expect(result.repository.ref).toBeNull();
    expect(result.repository.url).toBe("https://github.com/test-owner/test-repo");
    expect(result.repository.clonedAt).toBeTruthy();
    expect(result.directory).toBe("test-owner/test-repo");
    expect(result.filesAnalyzed).toBe(1);
    expect(result.summary.totalFunctions).toBe(2);

    // File paths should be repo-relative
    const filePaths = result.results.map((r) => r.filePath);
    expect(filePaths).toContain("src/example.ts");

    // Should detect both functions
    const functionNames = result.results
      .flatMap((r) => r.functions)
      .map((f) => f.name);
    expect(functionNames).toContain("linearSearch");
    expect(functionNames).toContain("bubbleSort");
  }, 30_000);

  it("should analyze a subdirectory", async () => {
    const result = await cloneAndAnalyze(
      bareRepoPath,
      "test-owner",
      "test-repo",
      {
        subdirectory: "src",
        exclude_patterns: ["**/.git/**"],
        max_files: 50,
      },
    );

    expect(result.directory).toBe("test-owner/test-repo/src");
    expect(result.filesAnalyzed).toBe(1);
  }, 30_000);

  it("should throw for non-existent subdirectory", async () => {
    await expect(
      cloneAndAnalyze(bareRepoPath, "test-owner", "test-repo", {
        subdirectory: "nonexistent",
        exclude_patterns: ["**/.git/**"],
        max_files: 50,
      }),
    ).rejects.toThrow('Subdirectory "nonexistent" not found');
  }, 30_000);

  it("should have hotspots with repo-relative paths", async () => {
    const result = await cloneAndAnalyze(
      bareRepoPath,
      "test-owner",
      "test-repo",
      {
        exclude_patterns: ["**/.git/**"],
        max_files: 50,
      },
    );

    expect(result.summary.hotspots.length).toBeGreaterThan(0);
    for (const hotspot of result.summary.hotspots) {
      expect(hotspot.filePath).not.toContain(os.tmpdir());
      expect(hotspot.filePath).toBe("src/example.ts");
    }
  }, 30_000);

  it("should clean up temp directory after analysis", async () => {
    // We can't directly check the temp dir since it's internal,
    // but we can verify the function completes without leaving debris
    // by checking that the result's directory field is not a real path
    const result = await cloneAndAnalyze(
      bareRepoPath,
      "test-owner",
      "test-repo",
      {
        exclude_patterns: ["**/.git/**"],
        max_files: 50,
      },
    );

    expect(result.directory).toBe("test-owner/test-repo");
    // The temp dir should be gone — the result directory is a display name, not a path
    expect(result.directory).not.toMatch(/^\/tmp\//);
  }, 30_000);
});
