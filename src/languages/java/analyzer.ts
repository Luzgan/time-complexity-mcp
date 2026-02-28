import Parser from "tree-sitter";
import Java from "tree-sitter-java";
import {
  BaseAnalyzer,
  type FunctionNodeTypes,
  type LoopNodeTypes,
  type KnownMethodComplexity,
} from "../../analyzer/base-analyzer.js";
import { FUNCTION_TYPES, LOOP_TYPES } from "./node-types.js";
import { KNOWN_METHODS } from "./patterns.js";

export class JavaAnalyzer extends BaseAnalyzer {
  readonly language = "Java";
  readonly extensions = [".java"];

  protected getGrammar(): unknown {
    return Java;
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
    return ["method_invocation"];
  }

  protected extractFunctionName(node: Parser.SyntaxNode): string {
    // method_declaration and constructor_declaration have a "name" field
    const nameNode = node.childForFieldName("name");
    return nameNode?.text ?? "<anonymous>";
  }

  protected extractParameters(node: Parser.SyntaxNode): string[] {
    const params: string[] = [];
    const paramsNode = node.childForFieldName("parameters");
    if (!paramsNode) return params;

    for (let i = 0; i < paramsNode.childCount; i++) {
      const child = paramsNode.child(i);
      if (child?.type === "formal_parameter" || child?.type === "spread_parameter") {
        const nameNode = child.childForFieldName("name");
        if (nameNode) {
          params.push(nameNode.text);
        }
      }
    }

    return params;
  }

  protected isConstantLoop(node: Parser.SyntaxNode): boolean {
    if (node.type === "for_statement") {
      const condition = node.childForFieldName("condition");
      if (!condition) return false;

      // Check for comparisons with numeric literals: i < 10
      if (condition.type === "binary_expression") {
        const right = condition.childForFieldName("right");
        if (right?.type === "decimal_integer_literal" || right?.type === "hex_integer_literal") {
          return true;
        }
      }
    }
    return false;
  }

  protected isLogarithmicLoop(node: Parser.SyntaxNode): boolean {
    // For-loop: check update expression for halving/doubling
    if (node.type === "for_statement") {
      const update = node.childForFieldName("update");
      if (update) {
        const text = update.text;
        if (/^[a-zA-Z_$]\w*\s*(?:\/=\s*2|>>=\s*1|\*=\s*2|<<=\s*1)\b/.test(text)) {
          return true;
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
          if (/^[a-zA-Z_$]\w*\s*(?:\/=\s*2|>>=\s*1|\*=\s*2|<<=\s*1)\b/.test(text)) {
            found = true;
          }
        }
      });
      return found;
    }

    return false;
  }

  protected getCallName(node: Parser.SyntaxNode): string | null {
    if (node.type !== "method_invocation") return null;

    const nameNode = node.childForFieldName("name");
    const objectNode = node.childForFieldName("object");

    if (!nameNode) return null;

    // Static/instance call: Collections.sort(list), list.contains(5)
    if (objectNode) {
      // For chained calls, the object might be another method_invocation
      if (objectNode.type === "method_invocation") {
        // Unwind the chain: list.stream().filter() → stream().filter
        const innerName = this.getCallName(objectNode);
        if (innerName) {
          return innerName + "." + nameNode.text;
        }
      }
      return objectNode.text + "." + nameNode.text;
    }

    // Local call: factorial(n - 1)
    return nameNode.text;
  }
}
