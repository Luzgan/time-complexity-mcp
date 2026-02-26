import type Parser from "tree-sitter";

export type BigOComplexity =
  | "O(1)"
  | "O(log n)"
  | "O(n)"
  | "O(n log n)"
  | "O(n^2)"
  | "O(n^3)"
  | "O(2^n)"
  | "O(n!)"
  | "unknown";

export interface ParsedFile {
  tree: Parser.Tree;
  sourceCode: string;
  language: string;
}

export interface FunctionNode {
  name: string;
  node: Parser.SyntaxNode;
  startLine: number;
  endLine: number;
  parameters: string[];
}

export interface LoopInfo {
  type: string;
  line: number;
  nestingDepth: number;
  estimatedComplexity: BigOComplexity;
}

export interface KnownCallInfo {
  name: string;
  line: number;
  complexity: BigOComplexity;
}

export interface LineAnnotation {
  line: number;
  complexity: BigOComplexity;
  note: string;
}

export interface FunctionComplexity {
  name: string;
  startLine: number;
  endLine: number;
  complexity: BigOComplexity;
  reasoning: string;
  loops: LoopInfo[];
  isRecursive: boolean;
  knownComplexityCalls: KnownCallInfo[];
  lineAnnotations: LineAnnotation[];
}

export interface FileAnalysisResult {
  filePath: string;
  language: string;
  functions: FunctionComplexity[];
  summary: {
    totalFunctions: number;
    highestComplexity: BigOComplexity;
    functionsByComplexity: Record<string, number>;
  };
}

export interface DirectoryAnalysisResult {
  directory: string;
  filesAnalyzed: number;
  filesSkipped: number;
  results: Array<{
    filePath: string;
    language: string;
    functionCount: number;
    highestComplexity: BigOComplexity;
    functions: Array<{
      name: string;
      complexity: BigOComplexity;
      line: number;
    }>;
  }>;
  summary: {
    totalFunctions: number;
    functionsByComplexity: Record<string, number>;
    hotspots: Array<{
      filePath: string;
      functionName: string;
      complexity: BigOComplexity;
      line: number;
    }>;
  };
}

export interface LanguageAnalyzer {
  readonly language: string;
  readonly extensions: string[];
  parse(sourceCode: string): ParsedFile;
  extractFunctions(parsed: ParsedFile): FunctionNode[];
  analyzeFunction(func: FunctionNode, parsed: ParsedFile): FunctionComplexity;
}

export interface LanguageInfo {
  name: string;
  extensions: string[];
  features: string[];
}
