import Parser from "tree-sitter";
import Go from "tree-sitter-go";
import {
  BaseAnalyzer,
  type FunctionNodeTypes,
  type LoopNodeTypes,
  type KnownMethodComplexity,
} from "../../analyzer/base-analyzer.js";
import { FUNCTION_TYPES, LOOP_TYPES } from "./node-types.js";
import { KNOWN_METHODS } from "./patterns.js";

export class GoAnalyzer extends BaseAnalyzer {
  readonly language = "Go";
  readonly extensions = [".go"];

  protected getGrammar(): unknown {
    return Go;
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
    const nameNode = node.childForFieldName("name");
    if (nameNode) return nameNode.text;
    return "<anonymous>";
  }

  protected extractParameters(node: Parser.SyntaxNode): string[] {
    const params: string[] = [];
    const paramList = node.childForFieldName("parameters");
    if (!paramList) return params;

    for (let i = 0; i < paramList.childCount; i++) {
      const param = paramList.child(i);
      if (
        param?.type === "parameter_declaration" ||
        param?.type === "variadic_parameter_declaration"
      ) {
        const nameNode = param.childForFieldName("name");
        if (nameNode) params.push(nameNode.text);
      }
    }

    return params;
  }

  protected isConstantLoop(node: Parser.SyntaxNode): boolean {
    if (node.type !== "for_statement") return false;

    // Traditional for with for_clause: for i := 0; i < 10; i++
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child?.type === "for_clause") {
        const condition = child.childForFieldName("condition");
        if (condition?.type === "binary_expression") {
          const right = condition.childForFieldName("right");
          if (right?.type === "int_literal" || right?.type === "float_literal") {
            return true;
          }
        }
        return false;
      }

      // Range loop over a composite literal (constant)
      if (child?.type === "range_clause") {
        const right = child.childForFieldName("right");
        if (right?.type === "composite_literal") return true;
        return false;
      }
    }

    return false;
  }

  protected getCallName(node: Parser.SyntaxNode): string | null {
    if (node.type !== "call_expression") return null;

    const fn = node.childForFieldName("function");
    if (!fn) return null;

    // Simple call: len(arr), append(s, v)
    if (fn.type === "identifier") {
      return fn.text;
    }

    // Package-qualified call: sort.Ints(arr), strings.Contains(s, sub)
    if (fn.type === "selector_expression") {
      const operand = fn.childForFieldName("operand");
      const field = fn.childForFieldName("field");
      if (operand && field) {
        return `${operand.text}.${field.text}`;
      }
    }

    return null;
  }
}
