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

    // Find function_value_parameters child, then extract parameter names
    const paramList = node.children.find(
      (c) => c.type === "function_value_parameters",
    );
    if (!paramList) return params;

    for (let j = 0; j < paramList.childCount; j++) {
      const param = paramList.child(j);
      if (param?.type === "parameter") {
        // Use field-based access or find first simple_identifier
        const name = param.children.find(
          (c) => c.type === "simple_identifier",
        );
        if (name) params.push(name.text);
      }
    }

    return params;
  }

  protected isConstantLoop(node: Parser.SyntaxNode): boolean {
    if (node.type !== "for_statement") return false;

    // Find range_expression child (e.g., 0 until 10, 0..9)
    const range = node.children.find((c) => c.type === "range_expression");
    if (!range) return false;

    // Single pass: check that range has at least one integer literal
    // and no variable identifiers (which would make it non-constant)
    let hasLiteral = false;
    let hasVariable = false;
    for (let j = 0; j < range.childCount; j++) {
      const sub = range.child(j);
      if (sub?.type === "integer_literal") hasLiteral = true;
      if (sub?.type === "simple_identifier") hasVariable = true;
    }
    return hasLiteral && !hasVariable;
  }

  protected isLogarithmicLoop(node: Parser.SyntaxNode): boolean {
    // Kotlin only has range-based for loops — no C-style for with update expression
    // While/do-while: check body for assignment with halving/doubling
    if (node.type === "while_statement" || node.type === "do_while_statement") {
      let found = false;
      this.walkNode(node, (child) => {
        if (found) return;
        if (child.type === "assignment") {
          const text = child.text;
          if (/^[a-zA-Z_]\w*\s*(?:\/=\s*2|>>=\s*1|\*=\s*2|<<=\s*1)\b/.test(text)) {
            found = true;
          }
        }
      });
      return found;
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
