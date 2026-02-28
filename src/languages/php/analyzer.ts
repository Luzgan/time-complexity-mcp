import Parser from "tree-sitter";
import PhpGrammar from "tree-sitter-php";
import {
  BaseAnalyzer,
  type FunctionNodeTypes,
  type LoopNodeTypes,
  type KnownMethodComplexity,
} from "../../analyzer/base-analyzer.js";
import { FUNCTION_TYPES, LOOP_TYPES } from "./node-types.js";
import { KNOWN_METHODS } from "./patterns.js";

export class PhpAnalyzer extends BaseAnalyzer {
  readonly language = "PHP";
  readonly extensions = [".php"];

  protected getGrammar(): unknown {
    return (PhpGrammar as any).php_only;
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
    return [
      "function_call_expression",
      "member_call_expression",
      "scoped_call_expression",
    ];
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
      if (param?.type === "simple_parameter" || param?.type === "variadic_parameter") {
        const nameNode = param.childForFieldName("name");
        if (nameNode) {
          // PHP variable names include $ prefix via variable_name node
          // Extract just the name part
          const name = nameNode.type === "variable_name"
            ? nameNode.children.find((c) => c.type === "name")?.text ?? nameNode.text
            : nameNode.text;
          params.push(name);
        }
      }
    }

    return params;
  }

  protected isConstantLoop(node: Parser.SyntaxNode): boolean {
    if (node.type === "for_statement") {
      // Check if the condition uses a literal bound
      const condition = node.childForFieldName("condition");
      if (condition?.type === "binary_expression") {
        const right = condition.childForFieldName("right");
        if (right?.type === "integer" || right?.type === "float") return true;
      }
    }

    if (node.type === "foreach_statement") {
      // Check if iterating over an array literal
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child?.type === "array_creation_expression") return true;
      }
    }

    return false;
  }

  protected getCallName(node: Parser.SyntaxNode): string | null {
    // function_call_expression: sort($arr) → child "name" = "sort"
    if (node.type === "function_call_expression") {
      const nameNode = node.childForFieldName("function") ?? node.child(0);
      if (nameNode?.type === "name") return nameNode.text;
      return nameNode?.text ?? null;
    }

    // member_call_expression: $this->method() → object->name
    if (node.type === "member_call_expression") {
      const nameNode = node.childForFieldName("name");
      const objectNode = node.childForFieldName("object");
      if (nameNode && objectNode) {
        return `${objectNode.text}.${nameNode.text}`;
      }
      return nameNode?.text ?? null;
    }

    // scoped_call_expression: self::method() → scope::name
    if (node.type === "scoped_call_expression") {
      const nameNode = node.childForFieldName("name");
      const scopeNode = node.childForFieldName("scope");
      if (nameNode && scopeNode) {
        return `${scopeNode.text}.${nameNode.text}`;
      }
      return nameNode?.text ?? null;
    }

    return null;
  }
}
