import Parser from "tree-sitter";
import path from "node:path";
import { createRequire } from "node:module";
import {
  BaseAnalyzer,
  type FunctionNodeTypes,
  type LoopNodeTypes,
  type KnownMethodComplexity,
} from "../../analyzer/base-analyzer.js";
import type {
  ParsedFile,
  FunctionNode,
  KnownCallInfo,
  BigOComplexity,
} from "../../analyzer/types.js";
import { FUNCTION_TYPES, LOOP_TYPES } from "./node-types.js";
import { KNOWN_METHODS } from "./patterns.js";

/**
 * Resolves the vendor tree-sitter-dart grammar.
 *
 * The grammar is built with NAPI bindings in vendor/tree-sitter-dart
 * and loaded at runtime via node-gyp-build.
 */
function loadDartGrammar(): unknown {
  const vendorDir = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "vendor",
    "tree-sitter-dart",
  );

  const require = createRequire(import.meta.url);
  const mod = require(vendorDir);
  return mod;
}

/**
 * Dart language analyzer for time-complexity detection.
 *
 * Key differences from the JavaScript analyzer:
 *
 * 1. **Function structure** — Dart's tree-sitter grammar represents
 *    top-level / class functions as *sibling* nodes: `function_signature`
 *    (or `method_signature`) followed by `function_body`. There is no
 *    single wrapper node. We override `extractFunctions` to pair them.
 *
 * 2. **Call expressions** — Dart has no `call_expression` node. Calls
 *    are represented as an `identifier` followed by `selector` nodes
 *    containing `argument_part`. We override the recursion and
 *    known-call detection methods to handle this.
 */
export class DartAnalyzer extends BaseAnalyzer {
  readonly language = "Dart";
  readonly extensions = [".dart"];

  protected getGrammar(): unknown {
    return loadDartGrammar();
  }

  protected getFunctionNodeTypes(): FunctionNodeTypes {
    return { types: [...FUNCTION_TYPES] };
  }

  protected getLoopNodeTypes(): LoopNodeTypes {
    return { types: [...LOOP_TYPES] };
  }

  protected getKnownMethods(): KnownMethodComplexity[] {
    return KNOWN_METHODS;
  }

  protected getCallNodeTypes(): string[] {
    // Dart has no call_expression node — all call detection is handled
    // by overridden methods using findCallSites().
    return [];
  }

  // ── Function extraction ─────────────────────────────────────────

  /**
   * Override to handle Dart's paired signature/body structure.
   *
   * Top-level functions:
   *   program → function_signature, function_body
   *
   * Class methods:
   *   class_body → method_signature, function_body
   *
   * Function expressions (anonymous functions):
   *   function_expression → formal_parameter_list, function_expression_body
   */
  override extractFunctions(parsed: ParsedFile): FunctionNode[] {
    const functions: FunctionNode[] = [];
    const seen = new Set<string>();

    this.walkNode(parsed.tree.rootNode, (node) => {
      // 1. function_body with a preceding signature sibling
      if (node.type === "function_body") {
        const sig = this.findPrecedingSignature(node);
        if (sig) {
          const name = this.extractNameFromSignature(sig);
          const startLine = sig.startPosition.row + 1;
          const endLine = node.endPosition.row + 1;
          const key = `${startLine}:${name}`;

          if (!seen.has(key)) {
            seen.add(key);
            functions.push({
              name,
              node, // use body as the analysis scope
              startLine,
              endLine,
              parameters: this.extractParametersFromSignature(sig),
            });
          }
        }
      }

      // 2. function_expression (anonymous functions / lambdas)
      if (node.type === "function_expression") {
        const name = this.extractFunctionExpressionName(node);
        const startLine = node.startPosition.row + 1;
        const endLine = node.endPosition.row + 1;
        const key = `${startLine}:${name}`;

        if (!seen.has(key)) {
          seen.add(key);
          functions.push({
            name,
            node,
            startLine,
            endLine,
            parameters: this.extractParameters(node),
          });
        }
      }
    });

    return functions;
  }

  /**
   * Finds the `function_signature` or `method_signature` that precedes
   * a `function_body` node as an immediate previous sibling.
   */
  private findPrecedingSignature(
    bodyNode: Parser.SyntaxNode,
  ): Parser.SyntaxNode | null {
    const prev = bodyNode.previousNamedSibling;
    if (!prev) return null;

    if (prev.type === "function_signature") return prev;

    if (prev.type === "method_signature") {
      // method_signature wraps function_signature, getter_signature, etc.
      return prev;
    }

    return null;
  }

  /**
   * Extracts the function name from a signature node.
   */
  private extractNameFromSignature(sig: Parser.SyntaxNode): string {
    // function_signature has a name field
    if (sig.type === "function_signature") {
      const nameNode = sig.childForFieldName("name");
      return nameNode?.text ?? "<anonymous>";
    }

    // method_signature wraps function_signature, getter_signature, etc.
    if (sig.type === "method_signature") {
      // Look for a nested function_signature
      for (let i = 0; i < sig.childCount; i++) {
        const child = sig.child(i);
        if (child?.type === "function_signature") {
          const nameNode = child.childForFieldName("name");
          return nameNode?.text ?? "<anonymous>";
        }
        if (child?.type === "getter_signature") {
          const nameNode = child.childForFieldName("name");
          return nameNode?.text ?? "<anonymous>";
        }
        if (child?.type === "setter_signature") {
          const nameNode = child.childForFieldName("name");
          return nameNode?.text ?? "<anonymous>";
        }
        if (child?.type === "constructor_signature") {
          const nameNode = child.childForFieldName("name");
          return nameNode?.text ?? "constructor";
        }
      }
    }

    return "<anonymous>";
  }

  /**
   * Extracts parameter names from a signature node.
   */
  private extractParametersFromSignature(
    sig: Parser.SyntaxNode,
  ): string[] {
    // Find the function_signature (may be nested inside method_signature)
    let funcSig = sig;
    if (sig.type === "method_signature") {
      for (let i = 0; i < sig.childCount; i++) {
        const child = sig.child(i);
        if (child?.type === "function_signature") {
          funcSig = child;
          break;
        }
      }
    }

    return this.extractParamsFromParamList(funcSig);
  }

  /**
   * Extracts parameter names from a node that has a formal_parameter_list.
   */
  private extractParamsFromParamList(node: Parser.SyntaxNode): string[] {
    const params: string[] = [];

    this.walkNode(node, (n) => {
      if (n.type === "formal_parameter_list") {
        for (let i = 0; i < n.childCount; i++) {
          const child = n.child(i);
          if (child?.type === "formal_parameter") {
            const nameNode = child.childForFieldName("name");
            if (nameNode) {
              params.push(nameNode.text);
            } else {
              // Fallback: last identifier child is usually the param name
              for (let j = child.childCount - 1; j >= 0; j--) {
                const sub = child.child(j);
                if (sub?.type === "identifier") {
                  params.push(sub.text);
                  break;
                }
              }
            }
          }
        }
      }
    });

    return params;
  }

  /**
   * Extract a name for function_expression nodes.
   * Checks if the parent is a variable declaration or assignment.
   */
  private extractFunctionExpressionName(
    node: Parser.SyntaxNode,
  ): string {
    const parent = node.parent;

    // var greet = (String name) { ... };
    if (parent?.type === "initialized_variable_definition") {
      const nameNode = parent.childForFieldName("name");
      return nameNode?.text ?? "<anonymous>";
    }

    // assignment: greet = (String name) { ... };
    if (parent?.type === "assignment_expression") {
      const left = parent.childForFieldName("left");
      return left?.text ?? "<anonymous>";
    }

    return "<anonymous>";
  }

  // ── Template method implementations ─────────────────────────────

  protected extractFunctionName(node: Parser.SyntaxNode): string {
    // This is called by the base class but we override extractFunctions,
    // so this is only used as a fallback.
    if (node.type === "function_body") {
      const sig = this.findPrecedingSignature(node);
      if (sig) return this.extractNameFromSignature(sig);
    }
    if (node.type === "function_expression") {
      return this.extractFunctionExpressionName(node);
    }
    return "<anonymous>";
  }

  protected extractParameters(node: Parser.SyntaxNode): string[] {
    if (node.type === "function_body") {
      const sig = this.findPrecedingSignature(node);
      if (sig) return this.extractParametersFromSignature(sig);
    }
    // function_expression has a formal_parameter_list child
    return this.extractParamsFromParamList(node);
  }

  protected isConstantLoop(node: Parser.SyntaxNode): boolean {
    if (node.type === "for_statement") {
      // Find the for_loop_parts child
      let loopParts: Parser.SyntaxNode | null = null;
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child?.type === "for_loop_parts") {
          loopParts = child;
          break;
        }
      }
      if (!loopParts) return false;

      // Check for a for-in loop with a list literal
      const valueNode = loopParts.childForFieldName("value");
      if (valueNode?.type === "list_literal") return true;

      // Check if condition compares against a numeric literal
      const condition = loopParts.childForFieldName("condition");
      if (condition) {
        // relational_expression: i < 10
        if (condition.type === "relational_expression") {
          // Walk children looking for a numeric literal
          for (let i = 0; i < condition.childCount; i++) {
            const child = condition.child(i);
            if (
              child?.type === "decimal_integer_literal" ||
              child?.type === "hex_integer_literal" ||
              child?.type === "decimal_floating_point_literal"
            ) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  protected isLogarithmicLoop(node: Parser.SyntaxNode): boolean {
    if (node.type === "for_statement") {
      // Find the for_loop_parts child and check updaters for halving/doubling
      let loopParts: Parser.SyntaxNode | null = null;
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child?.type === "for_loop_parts") {
          loopParts = child;
          break;
        }
      }
      if (loopParts) {
        // Check updater children for halving/doubling assignments
        for (let i = 0; i < loopParts.childCount; i++) {
          const child = loopParts.child(i);
          if (child?.type === "assignment_expression") {
            const text = child.text;
            // Dart uses ~/= for integer division assignment
            if (/^[a-zA-Z_$]\w*\s*(?:\/=\s*2|>>=\s*1|\*=\s*2|<<=\s*1|~\/=\s*2)\b/.test(text)) {
              return true;
            }
          }
        }
      }
    }

    // While/do-while: check body for assignment with halving/doubling
    if (node.type === "while_statement" || node.type === "do_statement") {
      let found = false;
      this.walkNode(node, (child) => {
        if (found) return;
        if (child.type === "assignment_expression") {
          const text = child.text;
          if (/^[a-zA-Z_$]\w*\s*(?:\/=\s*2|>>=\s*1|\*=\s*2|<<=\s*1|~\/=\s*2)\b/.test(text)) {
            found = true;
          }
        }
      });
      return found;
    }

    return false;
  }

  protected getCallName(_node: Parser.SyntaxNode): string | null {
    // Not used directly — we override detectRecursion / detectKnownCalls.
    return null;
  }

  // ── Call detection (Dart-specific) ──────────────────────────────

  /**
   * Finds all function/method call sites within a Dart AST subtree.
   *
   * In Dart's tree-sitter grammar, a call like `arr.sort()` is:
   *   identifier "arr"
   *   selector → unconditional_assignable_selector → . identifier "sort"
   *   selector → argument_part → arguments
   *
   * And a direct call like `factorial(n)` is:
   *   identifier "factorial"
   *   selector → argument_part → arguments
   *
   * We walk backward from the argument_part's selector to collect only
   * the immediately adjacent identifier/selector chain (stopping at
   * operators or other expression nodes).
   */
  private findCallSites(
    funcNode: Parser.SyntaxNode,
  ): Array<{ callName: string; line: number; node: Parser.SyntaxNode }> {
    const calls: Array<{
      callName: string;
      line: number;
      node: Parser.SyntaxNode;
    }> = [];

    this.walkNode(funcNode, (node) => {
      if (node.type !== "argument_part") return;

      const selectorNode = node.parent;
      if (!selectorNode || selectorNode.type !== "selector") return;

      const parent = selectorNode.parent;
      if (!parent) return;

      // Find the index of the selector containing argument_part
      let argSelectorIndex = -1;
      for (let i = 0; i < parent.childCount; i++) {
        const child = parent.child(i);
        if (child && child.id === selectorNode.id) {
          argSelectorIndex = i;
          break;
        }
      }
      if (argSelectorIndex < 0) return;

      // Walk backward from the argument_part selector to collect
      // the call chain (identifier + .method selectors)
      const parts: string[] = [];
      for (let i = argSelectorIndex - 1; i >= 0; i--) {
        const child = parent.child(i);
        if (!child) break;

        if (child.type === "identifier") {
          parts.unshift(child.text);
        } else if (child.type === "selector") {
          const methodName = this.extractMethodFromSelector(child);
          if (methodName) {
            parts.unshift("." + methodName);
          } else {
            break; // not a member-access selector, stop
          }
        } else {
          break; // operator, literal, or other expression — stop
        }
      }

      if (parts.length > 0) {
        const callName = parts.join("");
        calls.push({
          callName,
          line: selectorNode.startPosition.row + 1,
          node: selectorNode,
        });
      }
    });

    return calls;
  }

  /**
   * Extracts the method name from a selector node like:
   *   selector → unconditional_assignable_selector → . identifier
   */
  private extractMethodFromSelector(
    selector: Parser.SyntaxNode,
  ): string | null {
    for (let i = 0; i < selector.childCount; i++) {
      const child = selector.child(i);
      if (child?.type === "unconditional_assignable_selector") {
        // Look for the identifier after the dot
        for (let j = 0; j < child.childCount; j++) {
          const sub = child.child(j);
          if (sub?.type === "identifier") {
            return sub.text;
          }
        }
      }
      if (child?.type === "conditional_assignable_selector") {
        for (let j = 0; j < child.childCount; j++) {
          const sub = child.child(j);
          if (sub?.type === "identifier") {
            return sub.text;
          }
        }
      }
    }
    return null;
  }

  // ── Recursion detection ─────────────────────────────────────────

  protected override detectRecursion(
    funcNode: Parser.SyntaxNode,
    funcName: string,
  ): boolean {
    const calls = this.findCallSites(funcNode);
    return calls.some((c) => c.callName === funcName);
  }

  protected override classifyRecursion(
    funcNode: Parser.SyntaxNode,
    funcName: string,
  ): BigOComplexity {
    const calls = this.findCallSites(funcNode);
    const recursiveCalls = calls.filter((c) => c.callName === funcName);

    if (recursiveCalls.length === 0) return "O(1)";

    // Check whether each recursive call is inside a loop (tree traversal)
    const loopTypes = this.getLoopNodeTypes().types;
    let callsOutsideLoops = 0;

    for (const call of recursiveCalls) {
      let node = call.node.parent;
      let insideLoop = false;
      while (node && node.id !== funcNode.id) {
        if (loopTypes.includes(node.type)) {
          insideLoop = true;
          break;
        }
        node = node.parent;
      }
      if (!insideLoop) callsOutsideLoops++;
    }

    // At least one call inside a loop → tree traversal pattern → O(n)
    if (callsOutsideLoops < recursiveCalls.length) return "O(n)";
    if (recursiveCalls.length === 1) return "O(n)"; // linear recursion
    if (recursiveCalls.length >= 2) {
      // Check for divide-and-conquer: 2+ recursive calls + input halved
      if (this.containsDivisionByTwo(funcNode)) return "O(n log n)";
      return "O(2^n)"; // branching recursion (like fibonacci)
    }
    return "unknown";
  }

  // ── Loop-awareness for calls ─────────────────────────────────────

  /**
   * Override because BaseAnalyzer.isInsideLoop looks for `call_expression`
   * nodes, which don't exist in Dart. We look for `argument_part` nodes
   * at the matching line instead.
   */
  protected override isInsideLoop(
    call: KnownCallInfo,
    funcNode: Parser.SyntaxNode,
  ): boolean {
    const loopTypes = this.getLoopNodeTypes().types;
    let found = false;

    const walk = (node: Parser.SyntaxNode, inLoop: boolean): void => {
      if (found) return;

      const isLoop = loopTypes.includes(node.type);
      const currentInLoop = inLoop || isLoop;

      // In Dart, calls are identified by argument_part inside a selector
      if (
        node.type === "argument_part" &&
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

  // ── Known-method detection ──────────────────────────────────────

  protected override detectKnownCalls(
    funcNode: Parser.SyntaxNode,
  ): KnownCallInfo[] {
    const knownMethods = this.getKnownMethods();
    const calls = this.findCallSites(funcNode);
    const result: KnownCallInfo[] = [];

    for (const call of calls) {
      for (const method of knownMethods) {
        if (call.callName.endsWith(method.pattern)) {
          result.push({
            name: call.callName,
            line: call.line,
            complexity: method.complexity,
          });
          break;
        }
      }
    }

    return result;
  }
}
