import { describe, it, expect } from "vitest";
import path from "node:path";
import { analyzeFile } from "../src/tools/analyze-file.js";

const fixturesDir = path.join(import.meta.dirname, "fixtures");

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

describe("Dart analyze_file", () => {
  describe("dart-simple-loops.dart", () => {
    it("should detect O(n) for linearSearch", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-simple-loops.dart"),
      });
      const fn = result.functions.find((f) => f.name === "linearSearch");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });

    it("should detect O(1) for constant-bound loop", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-simple-loops.dart"),
      });
      const fn = result.functions.find((f) => f.name === "sumFirstTen");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(1)");
    });

    it("should detect O(n) for while loop", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-simple-loops.dart"),
      });
      const fn = result.functions.find((f) => f.name === "countDown");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });

    it("should detect O(1) for no loops", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-simple-loops.dart"),
      });
      const fn = result.functions.find((f) => f.name === "add");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(1)");
    });
  });

  describe("dart-nested-loops.dart", () => {
    it("should detect O(n^2) for bubble sort", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-nested-loops.dart"),
      });
      const fn = result.functions.find((f) => f.name === "bubbleSort");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^2)");
    });

    it("should detect O(n^3) for matrix multiply", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-nested-loops.dart"),
      });
      const fn = result.functions.find((f) => f.name === "matrixMultiply");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^3)");
    });
  });

  describe("dart-recursion.dart", () => {
    it("should detect O(n) for factorial (linear recursion)", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-recursion.dart"),
      });
      const fn = result.functions.find((f) => f.name === "factorial");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(2^n) for fibonacci (branching recursion)", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-recursion.dart"),
      });
      const fn = result.functions.find((f) => f.name === "fibonacci");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(2^n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(n) for tree traversal (recursive call inside loop)", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-recursion.dart"),
      });
      const fn = result.functions.find((f) => f.name === "traverseTree");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(log n) for logarithmic loop (halving pattern)", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-recursion.dart"),
      });
      const fn = result.functions.find((f) => f.name === "logarithmicLoop");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(log n)");
    });

    it("should detect O(n log n) for merge sort (divide-and-conquer)", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-recursion.dart"),
      });
      const fn = result.functions.find((f) => f.name === "mergeSort");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n log n)");
      expect(fn!.isRecursive).toBe(true);
    });
  });

  describe("dart-built-in-methods.dart", () => {
    it("should detect O(n log n) for sort", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-built-in-methods.dart"),
      });
      const fn = result.functions.find((f) => f.name === "sortList");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n log n)");
    });

    it("should detect O(n^2) for contains inside loop", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-built-in-methods.dart"),
      });
      const fn = result.functions.find((f) => f.name === "hasDuplicates");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^2)");
    });

    it("should detect O(n) for map", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-built-in-methods.dart"),
      });
      const fn = result.functions.find((f) => f.name === "doubleAll");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });
  });

  describe("summary", () => {
    it("should produce correct summary for file", async () => {
      const result = await analyzeFile({
        file_path: fixture("dart-simple-loops.dart"),
      });
      expect(result.summary.totalFunctions).toBe(4);
      expect(result.summary.highestComplexity).toBe("O(n)");
    });
  });
});
