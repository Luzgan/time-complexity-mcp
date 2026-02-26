import Parser from "tree-sitter";
import Kotlin from "tree-sitter-kotlin";
import {
  BaseAnalyzer,
  type FunctionNodeTypes,
  type LoopNodeTypes,
  type KnownMethodComplexity,
} from "../../analyzer/base-analyzer.js";
import { FUNCTION_TYPES, LOOP_TYPES } from "./node-types.js";
import { KNOWN_METHODS } from "./patterns.js";

export class KotlinAnalyzer extends BaseAnalyzer {
  readonly language = "Kotlin";
  readonly extensions = [".kt", ".kts"];

  protected getGrammar(): unknown {
    return Kotlin;
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
    return ["call_expression"];
  }

  protected extractFunctionName(node: Parser.SyntaxNode): string {
    // function_declaration: child(0)="fun", child(1)=simple_identifier (name)
    if (node.type === "function_declaration") {
      // The function name is the simple_identifier child after "fun"
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child?.type === "simple_identifier") {
          return child.text;
        }
      }
    }
    return "<anonymous>";
  }

  protected extractParameters(node: Parser.SyntaxNode): string[] {
    const params: string[] = [];

    // Find function_value_parameters child
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child?.type === "function_value_parameters") {
        // Each parameter child has: simple_identifier (name), ":", type
        for (let j = 0; j < child.childCount; j++) {
          const param = child.child(j);
          if (param?.type === "parameter") {
            // First simple_identifier is the parameter name
            for (let k = 0; k < param.childCount; k++) {
              const sub = param.child(k);
              if (sub?.type === "simple_identifier") {
                params.push(sub.text);
                break;
              }
            }
          }
        }
      }
    }

    return params;
  }

  protected isConstantLoop(node: Parser.SyntaxNode): boolean {
    if (node.type === "for_statement") {
      // Look for range expressions with numeric literals: 0 until 10, 0..9
      // The iterable is typically the 5th child (after "for", "(", var, "in")
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child?.type === "range_expression") {
          // Check if both bounds are integer literals
          let hasLiteralBounds = true;
          for (let j = 0; j < child.childCount; j++) {
            const sub = child.child(j);
            if (sub?.type === "integer_literal") continue;
            if (sub?.type === "simple_identifier") {
              hasLiteralBounds = false;
            }
          }
          // If we found a range with literal bounds, it's constant
          if (hasLiteralBounds) {
            // Check that there's at least one integer_literal
            for (let j = 0; j < child.childCount; j++) {
              if (child.child(j)?.type === "integer_literal") return true;
            }
          }
        }
      }
    }
    return false;
  }

  protected getCallName(node: Parser.SyntaxNode): string | null {
    if (node.type !== "call_expression") return null;

    const callee = node.child(0);
    if (!callee) return null;

    // Simple call: factorial(n)
    if (callee.type === "simple_identifier") {
      return callee.text;
    }

    // Method call: list.sort() → navigation_expression
    if (callee.type === "navigation_expression") {
      return callee.text;
    }

    return null;
  }
}
