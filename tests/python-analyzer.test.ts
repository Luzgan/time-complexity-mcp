import { describe, it, expect } from "vitest";
import path from "node:path";
import { analyzeFile } from "../src/tools/analyze-file.js";

const fixturesDir = path.join(import.meta.dirname, "fixtures");

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

describe("Python analyzer", () => {
  describe("python-simple-loops.py", () => {
    it("should detect O(n) for linear_search", async () => {
      const result = await analyzeFile({ file_path: fixture("python-simple-loops.py") });
      const fn = result.functions.find((f) => f.name === "linear_search");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });

    it("should detect O(1) for constant-bound loop", async () => {
      const result = await analyzeFile({ file_path: fixture("python-simple-loops.py") });
      const fn = result.functions.find((f) => f.name === "sum_first_ten");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(1)");
    });

    it("should detect O(n) for while loop", async () => {
      const result = await analyzeFile({ file_path: fixture("python-simple-loops.py") });
      const fn = result.functions.find((f) => f.name === "count_down");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });

    it("should detect O(1) for no loops", async () => {
      const result = await analyzeFile({ file_path: fixture("python-simple-loops.py") });
      const fn = result.functions.find((f) => f.name === "add");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(1)");
    });
  });

  describe("python-nested-loops.py", () => {
    it("should detect O(n^2) for bubble sort", async () => {
      const result = await analyzeFile({ file_path: fixture("python-nested-loops.py") });
      const fn = result.functions.find((f) => f.name === "bubble_sort");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^2)");
    });

    it("should detect O(n^3) for matrix multiply", async () => {
      const result = await analyzeFile({ file_path: fixture("python-nested-loops.py") });
      const fn = result.functions.find((f) => f.name === "matrix_multiply");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^3)");
    });
  });

  describe("python-recursion.py", () => {
    it("should detect O(n) for factorial (linear recursion)", async () => {
      const result = await analyzeFile({ file_path: fixture("python-recursion.py") });
      const fn = result.functions.find((f) => f.name === "factorial");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(2^n) for fibonacci (branching recursion)", async () => {
      const result = await analyzeFile({ file_path: fixture("python-recursion.py") });
      const fn = result.functions.find((f) => f.name === "fibonacci");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(2^n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(n) for tree traversal (recursive call inside loop)", async () => {
      const result = await analyzeFile({ file_path: fixture("python-recursion.py") });
      const fn = result.functions.find((f) => f.name === "traverse_tree");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(log n) for logarithmic loop (halving pattern)", async () => {
      const result = await analyzeFile({ file_path: fixture("python-recursion.py") });
      const fn = result.functions.find((f) => f.name === "log_loop");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(log n)");
    });

    it("should detect O(n log n) for merge sort (divide-and-conquer)", async () => {
      const result = await analyzeFile({ file_path: fixture("python-recursion.py") });
      const fn = result.functions.find((f) => f.name === "merge_sort");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n log n)");
      expect(fn!.isRecursive).toBe(true);
    });
  });

  describe("python-built-in-methods.py", () => {
    it("should detect O(n log n) for sort", async () => {
      const result = await analyzeFile({ file_path: fixture("python-built-in-methods.py") });
      const fn = result.functions.find((f) => f.name === "sort_list");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n log n)");
    });

    it("should detect O(n^2) for count inside loop", async () => {
      const result = await analyzeFile({ file_path: fixture("python-built-in-methods.py") });
      const fn = result.functions.find((f) => f.name === "has_duplicates");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^2)");
    });

    it("should detect O(n) for map", async () => {
      const result = await analyzeFile({ file_path: fixture("python-built-in-methods.py") });
      const fn = result.functions.find((f) => f.name === "double_all");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });
  });

  describe("summary", () => {
    it("should produce correct summary for file", async () => {
      const result = await analyzeFile({ file_path: fixture("python-simple-loops.py") });
      expect(result.summary.totalFunctions).toBe(4);
      expect(result.summary.highestComplexity).toBe("O(n)");
    });
  });
});
