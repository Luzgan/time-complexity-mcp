import { describe, it, expect } from "vitest";
import path from "node:path";
import { analyzeFile } from "../src/tools/analyze-file.js";

const fixturesDir = path.join(import.meta.dirname, "fixtures");

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

describe("PHP analyzer", () => {
  describe("php-simple-loops.php", () => {
    it("should detect O(n) for linearSearch", async () => {
      const result = await analyzeFile({ file_path: fixture("php-simple-loops.php") });
      const fn = result.functions.find((f) => f.name === "linearSearch");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });

    it("should detect O(1) for constant-bound loop", async () => {
      const result = await analyzeFile({ file_path: fixture("php-simple-loops.php") });
      const fn = result.functions.find((f) => f.name === "constantLoop");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(1)");
    });

    it("should detect O(n) for foreach loop", async () => {
      const result = await analyzeFile({ file_path: fixture("php-simple-loops.php") });
      const fn = result.functions.find((f) => f.name === "foreachLoop");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });

    it("should detect O(n) for while loop", async () => {
      const result = await analyzeFile({ file_path: fixture("php-simple-loops.php") });
      const fn = result.functions.find((f) => f.name === "whileLoop");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });
  });

  describe("php-nested-loops.php", () => {
    it("should detect O(n^2) for bubble sort", async () => {
      const result = await analyzeFile({ file_path: fixture("php-nested-loops.php") });
      const fn = result.functions.find((f) => f.name === "bubbleSort");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^2)");
    });

    it("should detect O(n^3) for triple nested", async () => {
      const result = await analyzeFile({ file_path: fixture("php-nested-loops.php") });
      const fn = result.functions.find((f) => f.name === "tripleNested");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^3)");
    });
  });

  describe("php-recursion.php", () => {
    it("should detect O(n) for factorial (linear recursion)", async () => {
      const result = await analyzeFile({ file_path: fixture("php-recursion.php") });
      const fn = result.functions.find((f) => f.name === "factorial");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(2^n) for fibonacci (branching recursion)", async () => {
      const result = await analyzeFile({ file_path: fixture("php-recursion.php") });
      const fn = result.functions.find((f) => f.name === "fibonacci");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(2^n)");
      expect(fn!.isRecursive).toBe(true);
    });
  });

  describe("php-built-in-methods.php", () => {
    it("should detect O(n log n) for sort()", async () => {
      const result = await analyzeFile({ file_path: fixture("php-built-in-methods.php") });
      const fn = result.functions.find((f) => f.name === "sortArray");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n log n)");
    });

    it("should detect O(n^2) for in_array inside loop", async () => {
      const result = await analyzeFile({ file_path: fixture("php-built-in-methods.php") });
      const fn = result.functions.find((f) => f.name === "hasDuplicates");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^2)");
    });

    it("should detect O(1) for array_push", async () => {
      const result = await analyzeFile({ file_path: fixture("php-built-in-methods.php") });
      const fn = result.functions.find((f) => f.name === "pushToArray");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(1)");
    });
  });

  describe("summary", () => {
    it("should produce correct summary for file", async () => {
      const result = await analyzeFile({ file_path: fixture("php-simple-loops.php") });
      expect(result.summary.totalFunctions).toBe(4);
      expect(result.summary.highestComplexity).toBe("O(n)");
    });
  });
});
