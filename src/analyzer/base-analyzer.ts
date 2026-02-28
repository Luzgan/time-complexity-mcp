import Parser from "tree-sitter";
import type {
  LanguageAnalyzer,
  ParsedFile,
  FunctionNode,
  FunctionComplexity,
  LoopInfo,
  KnownCallInfo,
  LineAnnotation,
  BigOComplexity,
} from "./types.js";
import {
  maxComplexity,
  multiplyComplexity,
  complexityFromDepth,
} from "./complexity.js";

export interface LoopNodeTypes {
  types: string[];
}

export interface FunctionNodeTypes {
  types: string[];
}

export interface KnownMethodComplexity {
  pattern: string;
  complexity: BigOComplexity;
}

export abstract class BaseAnalyzer implements LanguageAnalyzer {
  abstract readonly language: string;
  abstract readonly extensions: string[];

  protected parser: Parser;

  protected abstract getGrammar(): unknown;
  protected abstract getFunctionNodeTypes(): FunctionNodeTypes;
  protected abstract getLoopNodeTypes(): LoopNodeTypes;
  protected abstract getKnownMethods(): KnownMethodComplexity[];
  protected abstract extractFunctionName(node: Parser.SyntaxNode): string;
  protected abstract extractParameters(node: Parser.SyntaxNode): string[];
  protected abstract isConstantLoop(node: Parser.SyntaxNode): boolean;
  protected abstract isLogarithmicLoop(node: Parser.SyntaxNode): boolean;
  protected abstract getCallName(node: Parser.SyntaxNode): string | null;
  protected abstract getCallNodeTypes(): string[];

  constructor() {
    this.parser = new Parser();
  }

  protected initParser(): void {
    this.parser.setLanguage(this.getGrammar() as any);
  }

  parse(sourceCode: string): ParsedFile {
    this.initParser();
    const tree = this.parser.parse(sourceCode);
    return { tree, sourceCode, language: this.language };
  }

  extractFunctions(parsed: ParsedFile): FunctionNode[] {
    const functions: FunctionNode[] = [];
    const fnTypes = this.getFunctionNodeTypes().types;
    const seen = new Set<string>();

    this.walkNode(parsed.tree.rootNode, (node) => {
      if (fnTypes.includes(node.type)) {
        const name = this.extractFunctionName(node);
        // Deduplicate by position — tree-sitter TS may nest function inside function_declaration
        const key = `${node.startPosition.row}:${node.startPosition.column}:${name}`;
        if (name && !seen.has(key)) {
          // Also skip if a parent function node at the same position was already recorded
          const posKey = `${node.startPosition.row}:${node.startPosition.column}`;
          const duplicate = functions.some(
            (f) =>
              f.startLine === node.startPosition.row + 1 &&
              f.node.startPosition.column === node.startPosition.column,
          );
          if (!duplicate) {
            seen.add(key);
            functions.push({
              name,
              node,
              startLine: node.startPosition.row + 1,
              endLine: node.endPosition.row + 1,
              parameters: this.extractParameters(node),
            });
          }
        }
      }
    });

    return functions;
  }

  analyzeFunction(func: FunctionNode, parsed: ParsedFile): FunctionComplexity {
    const loops = this.detectLoops(func.node);
    const isRecursive = this.detectRecursion(func.node, func.name);
    const knownCalls = this.detectKnownCalls(func.node);
    const lineAnnotations: LineAnnotation[] = [];

    // Compute complexity from loops — use per-loop estimatedComplexity
    let loopComplexity: BigOComplexity = "O(1)";
    if (loops.length > 0) {
      loopComplexity = loops.reduce(
        (max, l) => maxComplexity(max, l.estimatedComplexity),
        "O(1)" as BigOComplexity,
      );
    }

    // Factor in known method calls within loops
    let overallComplexity = loopComplexity;
    for (const call of knownCalls) {
      // Check if this call is inside a loop
      const insideLoop = this.isInsideLoop(call, func.node);
      if (insideLoop) {
        overallComplexity = maxComplexity(
          overallComplexity,
          multiplyComplexity(loopComplexity, call.complexity),
        );
      } else {
        overallComplexity = maxComplexity(overallComplexity, call.complexity);
      }
    }

    // Factor in recursion
    if (isRecursive) {
      const recursionComplexity = this.classifyRecursion(func.node, func.name);
      overallComplexity = maxComplexity(overallComplexity, recursionComplexity);
    }

    // Build reasoning
    const reasoning = this.buildReasoning(
      func,
      loops,
      isRecursive,
      knownCalls,
      overallComplexity,
    );

    // Build line annotations
    for (const loop of loops) {
      const isLog = loop.estimatedComplexity === "O(log n)" || loop.estimatedComplexity === "O(n log n)";
      const note = isLog
        ? `${loop.type} loop (logarithmic — halving/doubling)`
        : `${loop.type} loop (nesting depth: ${loop.nestingDepth})`;
      lineAnnotations.push({
        line: loop.line,
        complexity: loop.estimatedComplexity,
        note,
      });
    }
    for (const call of knownCalls) {
      lineAnnotations.push({
        line: call.line,
        complexity: call.complexity,
        note: `${call.name}`,
      });
    }

    return {
      name: func.name,
      startLine: func.startLine,
      endLine: func.endLine,
      complexity: overallComplexity,
      reasoning,
      loops,
      isRecursive,
      knownComplexityCalls: knownCalls,
      lineAnnotations,
    };
  }

  protected detectLoops(
    funcNode: Parser.SyntaxNode,
  ): LoopInfo[] {
    const loopTypes = this.getLoopNodeTypes().types;
    const loops: LoopInfo[] = [];

    const walk = (node: Parser.SyntaxNode, currentLoopDepth: number): void => {
      if (loopTypes.includes(node.type)) {
        const isConstant = this.isConstantLoop(node);
        const isLogarithmic = !isConstant && this.isLogarithmicLoop(node);

        let depth: number;
        let complexity: BigOComplexity;

        if (isConstant) {
          depth = 0;
          complexity = "O(1)";
        } else if (isLogarithmic) {
          // Logarithmic loop: standalone → O(log n), inside O(n) loop → O(n log n)
          depth = 0;
          complexity = multiplyComplexity(complexityFromDepth(currentLoopDepth), "O(log n)");
        } else {
          depth = currentLoopDepth + 1;
          complexity = complexityFromDepth(depth);
        }

        loops.push({
          type: node.type,
          line: node.startPosition.row + 1,
          nestingDepth: depth,
          estimatedComplexity: complexity,
        });

        // Recurse into children — only increment depth for variable-bound loops
        const childDepth = (isConstant || isLogarithmic) ? currentLoopDepth : currentLoopDepth + 1;
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child) walk(child, childDepth);
        }
        return;
      }

      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) walk(child, currentLoopDepth);
      }
    };

    walk(funcNode, 0);
    return loops;
  }

  protected detectRecursion(
    funcNode: Parser.SyntaxNode,
    funcName: string,
  ): boolean {
    let found = false;
    this.walkNode(funcNode, (node) => {
      if (this.getCallNodeTypes().includes(node.type)) {
        const callName = this.getCallName(node);
        if (callName === funcName) {
          found = true;
        }
      }
    });
    return found;
  }

  protected classifyRecursion(
    funcNode: Parser.SyntaxNode,
    funcName: string,
  ): BigOComplexity {
    // Count recursive calls, distinguishing those inside loops (tree traversal)
    // from those outside loops (branching recursion like fibonacci)
    let totalCalls = 0;
    let callsOutsideLoops = 0;
    const loopTypes = this.getLoopNodeTypes().types;

    const walk = (node: Parser.SyntaxNode, inLoop: boolean): void => {
      const isLoop = loopTypes.includes(node.type);
      const currentInLoop = inLoop || isLoop;

      if (this.getCallNodeTypes().includes(node.type)) {
        const callName = this.getCallName(node);
        if (callName === funcName) {
          totalCalls++;
          if (!currentInLoop) callsOutsideLoops++;
        }
      }

      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) walk(child, currentInLoop);
      }
    };

    walk(funcNode, false);

    if (totalCalls === 0) return "O(1)";
    // At least one call inside a loop → tree traversal pattern → O(n)
    if (callsOutsideLoops < totalCalls) return "O(n)";
    if (totalCalls === 1) return "O(n)"; // linear recursion
    if (totalCalls >= 2) {
      // Check for divide-and-conquer: 2+ recursive calls + input halved
      if (this.containsDivisionByTwo(funcNode)) return "O(n log n)";
      return "O(2^n)"; // branching recursion (like fibonacci)
    }
    return "unknown";
  }

  /**
   * Check if a function body contains division by 2 (or right-shift by 1),
   * which is a hallmark of divide-and-conquer algorithms (merge sort, etc.)
   * and logarithmic loops.
   *
   * Language-agnostic: checks the full function text rather than specific
   * AST node types, since division operators vary across grammars
   * (binary_expression, multiplicative_expression, intdiv(), ~/ etc.)
   */
  protected containsDivisionByTwo(funcNode: Parser.SyntaxNode): boolean {
    const text = funcNode.text;
    // Match: / 2, /= 2, >> 1, >>= 1, // 2 (Python), ~/ 2 (Dart), intdiv(
    return /\/\s*2\b/.test(text) || />>\s*1\b/.test(text) || /~\/\s*2\b/.test(text) || /intdiv\s*\(/.test(text);
  }

  protected detectKnownCalls(funcNode: Parser.SyntaxNode): KnownCallInfo[] {
    const knownMethods = this.getKnownMethods();
    const calls: KnownCallInfo[] = [];

    this.walkNode(funcNode, (node) => {
      if (this.getCallNodeTypes().includes(node.type)) {
        const callName = this.getCallName(node);
        if (callName) {
          for (const method of knownMethods) {
            if (callName.endsWith(method.pattern)) {
              calls.push({
                name: callName,
                line: node.startPosition.row + 1,
                complexity: method.complexity,
              });
              break;
            }
          }
        }
      }
    });

    return calls;
  }

  protected isInsideLoop(
    call: KnownCallInfo,
    funcNode: Parser.SyntaxNode,
  ): boolean {
    const loopTypes = this.getLoopNodeTypes().types;
    let found = false;

    const walk = (node: Parser.SyntaxNode, inLoop: boolean): void => {
      const isLoop = loopTypes.includes(node.type);
      const currentInLoop = inLoop || isLoop;

      if (
        this.getCallNodeTypes().includes(node.type) &&
        node.startPosition.row + 1 === call.line &&
        currentInLoop
      ) {
        found = true;
        return;
      }

      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) walk(child, currentInLoop);
      }
    };

    walk(funcNode, false);
    return found;
  }

  protected buildReasoning(
    func: FunctionNode,
    loops: LoopInfo[],
    isRecursive: boolean,
    knownCalls: KnownCallInfo[],
    overall: BigOComplexity,
  ): string {
    const parts: string[] = [];

    if (loops.length === 0 && !isRecursive && knownCalls.length === 0) {
      parts.push("No loops, recursion, or known complex calls detected.");
    }

    if (loops.length > 0) {
      const nonConstant = loops.filter(
        (l) => l.nestingDepth > 0 && l.estimatedComplexity !== "O(log n)" && l.estimatedComplexity !== "O(n log n)",
      );
      const constant = loops.filter((l) => l.estimatedComplexity === "O(1)");
      const logarithmic = loops.filter(
        (l) => l.estimatedComplexity === "O(log n)" || l.estimatedComplexity === "O(n log n)",
      );
      if (nonConstant.length > 0) {
        const maxDepth = Math.max(...nonConstant.map((l) => l.nestingDepth));
        parts.push(
          `Found ${nonConstant.length} variable-bound loop(s), max nesting depth: ${maxDepth}.`,
        );
      }
      if (logarithmic.length > 0) {
        parts.push(`Found ${logarithmic.length} logarithmic loop(s) (halving/doubling pattern).`);
      }
      if (constant.length > 0) {
        parts.push(`Found ${constant.length} constant-bound loop(s).`);
      }
    }

    if (isRecursive) {
      parts.push(`Function is recursive.`);
    }

    if (knownCalls.length > 0) {
      const callDescs = knownCalls.map((c) => `${c.name} (${c.complexity})`);
      parts.push(`Known complexity calls: ${callDescs.join(", ")}.`);
    }

    parts.push(`Overall: ${overall}.`);
    return parts.join(" ");
  }

  protected walkNode(
    node: Parser.SyntaxNode,
    callback: (node: Parser.SyntaxNode) => void,
  ): void {
    callback(node);
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) this.walkNode(child, callback);
    }
  }
}
