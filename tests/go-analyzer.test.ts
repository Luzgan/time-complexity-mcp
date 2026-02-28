import { describe, it, expect } from "vitest";
import path from "node:path";
import { analyzeFile } from "../src/tools/analyze-file.js";

const fixturesDir = path.join(import.meta.dirname, "fixtures");

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

describe("Go analyzer", () => {
  describe("go-simple-loops.go", () => {
    it("should detect O(n) for linearSearch", async () => {
      const result = await analyzeFile({ file_path: fixture("go-simple-loops.go") });
      const fn = result.functions.find((f) => f.name === "linearSearch");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });

    it("should detect O(1) for constant-bound loop", async () => {
      const result = await analyzeFile({ file_path: fixture("go-simple-loops.go") });
      const fn = result.functions.find((f) => f.name === "constantLoop");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(1)");
    });

    it("should detect O(n) for range loop", async () => {
      const result = await analyzeFile({ file_path: fixture("go-simple-loops.go") });
      const fn = result.functions.find((f) => f.name === "rangeLoop");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });

    it("should detect O(n) for while-style loop", async () => {
      const result = await analyzeFile({ file_path: fixture("go-simple-loops.go") });
      const fn = result.functions.find((f) => f.name === "whileStyleLoop");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
    });
  });

  describe("go-nested-loops.go", () => {
    it("should detect O(n^2) for bubble sort", async () => {
      const result = await analyzeFile({ file_path: fixture("go-nested-loops.go") });
      const fn = result.functions.find((f) => f.name === "bubbleSort");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^2)");
    });

    it("should detect O(n^3) for triple nested", async () => {
      const result = await analyzeFile({ file_path: fixture("go-nested-loops.go") });
      const fn = result.functions.find((f) => f.name === "tripleNested");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^3)");
    });
  });

  describe("go-recursion.go", () => {
    it("should detect O(n) for factorial (linear recursion)", async () => {
      const result = await analyzeFile({ file_path: fixture("go-recursion.go") });
      const fn = result.functions.find((f) => f.name === "factorial");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(2^n) for fibonacci (branching recursion)", async () => {
      const result = await analyzeFile({ file_path: fixture("go-recursion.go") });
      const fn = result.functions.find((f) => f.name === "fibonacci");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(2^n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(n) for tree traversal (recursive call inside loop)", async () => {
      const result = await analyzeFile({ file_path: fixture("go-recursion.go") });
      const fn = result.functions.find((f) => f.name === "traverseTree");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n)");
      expect(fn!.isRecursive).toBe(true);
    });

    it("should detect O(log n) for logarithmic loop (halving pattern)", async () => {
      const result = await analyzeFile({ file_path: fixture("go-recursion.go") });
      const fn = result.functions.find((f) => f.name === "logarithmicLoop");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(log n)");
    });

    it("should detect O(n log n) for merge sort (divide-and-conquer)", async () => {
      const result = await analyzeFile({ file_path: fixture("go-recursion.go") });
      const fn = result.functions.find((f) => f.name === "mergeSort");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n log n)");
      expect(fn!.isRecursive).toBe(true);
    });
  });

  describe("go-built-in-methods.go", () => {
    it("should detect O(n log n) for sort.Ints", async () => {
      const result = await analyzeFile({ file_path: fixture("go-built-in-methods.go") });
      const fn = result.functions.find((f) => f.name === "sortSlice");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n log n)");
    });

    it("should detect O(n^2) for strings.Contains inside loop", async () => {
      const result = await analyzeFile({ file_path: fixture("go-built-in-methods.go") });
      const fn = result.functions.find((f) => f.name === "hasDuplicates");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(n^2)");
    });

    it("should detect O(1) for append", async () => {
      const result = await analyzeFile({ file_path: fixture("go-built-in-methods.go") });
      const fn = result.functions.find((f) => f.name === "appendToSlice");
      expect(fn).toBeDefined();
      expect(fn!.complexity).toBe("O(1)");
    });
  });

  describe("summary", () => {
    it("should produce correct summary for file", async () => {
      const result = await analyzeFile({ file_path: fixture("go-simple-loops.go") });
      expect(result.summary.totalFunctions).toBe(4);
      expect(result.summary.highestComplexity).toBe("O(n)");
    });
  });
});
