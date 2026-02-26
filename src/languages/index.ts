import path from "node:path";
import type { LanguageAnalyzer, LanguageInfo } from "../analyzer/types.js";
import { JavaScriptAnalyzer } from "./javascript/analyzer.js";
import { DartAnalyzer } from "./dart/analyzer.js";
import { KotlinAnalyzer } from "./kotlin/analyzer.js";
import { JavaAnalyzer } from "./java/analyzer.js";
import { PythonAnalyzer } from "./python/analyzer.js";

type AnalyzerFactory = () => LanguageAnalyzer;

const registry = new Map<string, AnalyzerFactory>();

// JavaScript / TypeScript
registry.set(".js", () => new JavaScriptAnalyzer("javascript"));
registry.set(".mjs", () => new JavaScriptAnalyzer("javascript"));
registry.set(".cjs", () => new JavaScriptAnalyzer("javascript"));
registry.set(".jsx", () => new JavaScriptAnalyzer("javascript"));
registry.set(".ts", () => new JavaScriptAnalyzer("typescript"));
registry.set(".tsx", () => new JavaScriptAnalyzer("tsx"));

// Dart
registry.set(".dart", () => new DartAnalyzer());

// Kotlin
registry.set(".kt", () => new KotlinAnalyzer());
registry.set(".kts", () => new KotlinAnalyzer());

// Java
registry.set(".java", () => new JavaAnalyzer());

// Python
registry.set(".py", () => new PythonAnalyzer());

export function getAnalyzerForFile(
  filePath: string,
): LanguageAnalyzer | null {
  const ext = path.extname(filePath).toLowerCase();
  const factory = registry.get(ext);
  return factory ? factory() : null;
}

export function getSupportedExtensions(): string[] {
  return [...registry.keys()];
}

export function getSupportedLanguages(): LanguageInfo[] {
  return [
    {
      name: "JavaScript/TypeScript",
      extensions: [".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx"],
      features: ["loops", "recursion", "built-in-methods"],
    },
    {
      name: "Dart",
      extensions: [".dart"],
      features: ["loops", "recursion", "built-in-methods"],
    },
    {
      name: "Kotlin",
      extensions: [".kt", ".kts"],
      features: ["loops", "recursion", "built-in-methods"],
    },
    {
      name: "Java",
      extensions: [".java"],
      features: ["loops", "recursion", "built-in-methods"],
    },
    {
      name: "Python",
      extensions: [".py"],
      features: ["loops", "recursion", "built-in-methods"],
    },
  ];
}
