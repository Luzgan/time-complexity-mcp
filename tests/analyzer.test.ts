import { describe, it, expect } from "vitest";
import path from "node:path";
import { analyzeFile } from "../src/tools/analyze-file.js";

const fixturesDir = path.join(import.meta.dirname, "fixtures");

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

describe("analyze_file", () => {
  describe("simple-loops.ts", () => {
    it("should detect O(n) for linearSearch", async () => {
      const result = await analyzeFile({ file_path: fixture("simple-loops.ts") });
      const fn = result.functions.find((f) => f.name === "linearSearch");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });

    it("should detect O(1) for constant-bound loop", async () => {
      const result = await analyzeFile({ file_path: fixture("simple-loops.ts") });
      const fn = result.functions.find((f) => f.name === "sumFirstTen");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(1)");
    });

    it("should detect O(n) for while loop", async () => {
      const result = await analyzeFile({ file_path: fixture("simple-loops.ts") });
      const fn = result.functions.find((f) => f.name === "countDown");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });

    it("should detect O(1) for no loops", async () => {
      const result = await analyzeFile({ file_path: fixture("simple-loops.ts") });
      const fn = result.functions.find((f) => f.name === "add");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(1)");
    });
  });

  describe("nested-loops.ts", () => {
    it("should detect O(n^2) for bubble sort", async () => {
      const result = await analyzeFile({ file_path: fixture("nested-loops.ts") });
      const fn = result.functions.find((f) => f.name === "bubbleSort");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^2)");
    });

    it("should detect O(n^3) for matrix multiply", async () => {
      const result = await analyzeFile({ file_path: fixture("nested-loops.ts") });
      const fn = result.functions.find((f) => f.name === "matrixMultiply");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^3)");
    });
  });

  describe("recursion.ts", () => {
    it("should detect O(n) for factorial (linear recursion)", async () => {
      const result = await analyzeFile({ file_path: fixture("recursion.ts") });
      const fn = result.functions.find((f) => f.name === "factorial");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(2^n) for fibonacci (branching recursion)", async () => {
      const result = await analyzeFile({ file_path: fixture("recursion.ts") });
      const fn = result.functions.find((f) => f.name === "fibonacci");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(2^n)");
      expect(fn!.isRecursive).toBe(true);
    });
  });

  describe("built-in-methods.ts", () => {
    it("should detect O(n log n) for sort", async () => {
      const result = await analyzeFile({ file_path: fixture("built-in-methods.ts") });
      const fn = result.functions.find((f) => f.name === "sortArray");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n log n)");
    });

    it("should detect O(n^2) for includes inside loop", async () => {
      const result = await analyzeFile({ file_path: fixture("built-in-methods.ts") });
      const fn = result.functions.find((f) => f.name === "hasDuplicates");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^2)");
    });

    it("should detect O(n) for map", async () => {
      const result = await analyzeFile({ file_path: fixture("built-in-methods.ts") });
      const fn = result.functions.find((f) => f.name === "doubleAll");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });
  });

  describe("summary", () => {
    it("should produce correct summary for file", async () => {
      const result = await analyzeFile({ file_path: fixture("simple-loops.ts") });
      expect(result.summary.totalFunctions).toBe(4);
      expect(result.summary.highestComplexity).toBe("O(n)");
    });
  });
});
