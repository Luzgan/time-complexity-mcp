import Parser from "tree-sitter";
import Python from "tree-sitter-python";
import {
  BaseAnalyzer,
  type FunctionNodeTypes,
  type LoopNodeTypes,
  type KnownMethodComplexity,
} from "../../analyzer/base-analyzer.js";
import type {
  ParsedFile,
  FunctionNode,
} from "../../analyzer/types.js";
import { FUNCTION_TYPES, LOOP_TYPES } from "./node-types.js";
import { KNOWN_METHODS } from "./patterns.js";

export class PythonAnalyzer extends BaseAnalyzer {
  readonly language = "Python";
  readonly extensions = [".py"];

  protected getGrammar(): unknown {
    return Python;
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
    return ["call"];
  }

  /**
   * Override to also find functions inside decorated_definition nodes.
   */
  override extractFunctions(parsed: ParsedFile): FunctionNode[] {
    const functions: FunctionNode[] = [];
    const fnTypes = this.getFunctionNodeTypes().types;
    const seen = new Set<string>();

    this.walkNode(parsed.tree.rootNode, (node) => {
      // Handle decorated_definition: extract the inner function_definition
      if (node.type === "decorated_definition") {
        const innerFn = node.childForFieldName("definition");
        if (innerFn && fnTypes.includes(innerFn.type)) {
          const name = this.extractFunctionName(innerFn);
          const key = `${node.startPosition.row}:${node.startPosition.column}:${name}`;
          if (name && !seen.has(key)) {
            seen.add(key);
            functions.push({
              name,
              node: innerFn,
              startLine: node.startPosition.row + 1,
              endLine: node.endPosition.row + 1,
              parameters: this.extractParameters(innerFn),
            });
          }
        }
        return; // don't walk into children — we already handled the function
      }

      if (fnTypes.includes(node.type)) {
        // Skip if this function_definition is inside a decorated_definition
        // (already handled above)
        if (node.parent?.type === "decorated_definition") return;

        const name = this.extractFunctionName(node);
        const key = `${node.startPosition.row}:${node.startPosition.column}:${name}`;
        if (name && !seen.has(key)) {
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

  protected extractFunctionName(node: Parser.SyntaxNode): string {
    // function_definition has a "name" field
    const nameNode = node.childForFieldName("name");
    return nameNode?.text ?? "<anonymous>";
  }

  protected extractParameters(node: Parser.SyntaxNode): string[] {
    const params: string[] = [];
    const paramsNode = node.childForFieldName("parameters");
    if (!paramsNode) return params;

    for (let i = 0; i < paramsNode.childCount; i++) {
      const child = paramsNode.child(i);
      if (!child) continue;

      // Regular parameter: identifier
      if (child.type === "identifier") {
        // Skip "self" and "cls"
        if (child.text !== "self" && child.text !== "cls") {
          params.push(child.text);
        }
      }

      // Typed parameter: name: type
      if (child.type === "typed_parameter") {
        const nameNode = child.childForFieldName("name") ?? child.child(0);
        if (nameNode && nameNode.text !== "self" && nameNode.text !== "cls") {
          params.push(nameNode.text);
        }
      }

      // Default parameter: name = value
      if (child.type === "default_parameter") {
        const nameNode = child.childForFieldName("name");
        if (nameNode && nameNode.text !== "self" && nameNode.text !== "cls") {
          params.push(nameNode.text);
        }
      }

      // Typed default parameter: name: type = value
      if (child.type === "typed_default_parameter") {
        const nameNode = child.childForFieldName("name");
        if (nameNode && nameNode.text !== "self" && nameNode.text !== "cls") {
          params.push(nameNode.text);
        }
      }

      // *args
      if (child.type === "list_splat_pattern") {
        const nameNode = child.child(1) ?? child.child(0);
        if (nameNode?.type === "identifier") {
          params.push("*" + nameNode.text);
        }
      }

      // **kwargs
      if (child.type === "dictionary_splat_pattern") {
        const nameNode = child.child(1) ?? child.child(0);
        if (nameNode?.type === "identifier") {
          params.push("**" + nameNode.text);
        }
      }
    }

    return params;
  }

  protected isConstantLoop(node: Parser.SyntaxNode): boolean {
    if (node.type === "for_statement") {
      // Check for `for x in range(N)` where N is a literal
      const right = node.childForFieldName("right");
      if (right?.type === "call") {
        const funcNode = right.childForFieldName("function");
        if (funcNode?.type === "identifier" && funcNode.text === "range") {
          const args = right.childForFieldName("arguments");
          if (args) {
            // Check if all arguments are integer literals
            let allLiteral = true;
            let hasArg = false;
            for (let i = 0; i < args.childCount; i++) {
              const arg = args.child(i);
              if (!arg || arg.type === "(" || arg.type === ")" || arg.type === ",") continue;
              hasArg = true;
              if (arg.type !== "integer") {
                allLiteral = false;
              }
            }
            if (hasArg && allLiteral) return true;
          }
        }
      }

      // Check for `for x in [1, 2, 3]` (literal list)
      if (right?.type === "list") return true;
      if (right?.type === "tuple") return true;
    }
    return false;
  }

  protected isLogarithmicLoop(node: Parser.SyntaxNode): boolean {
    // Python only has range-based for loops — no C-style for with update expression
    // While: check body for augmented assignment with halving/doubling
    if (node.type === "while_statement") {
      let found = false;
      this.walkNode(node, (child) => {
        if (found) return;
        if (child.type === "augmented_assignment") {
          const text = child.text;
          // Python uses //= for integer division assignment
          if (/^[a-zA-Z_]\w*\s*(?:\/\/=\s*2|\/=\s*2|>>=\s*1|\*=\s*2|<<=\s*1)\b/.test(text)) {
            found = true;
          }
        }
      });
      return found;
    }

    return false;
  }

  protected getCallName(node: Parser.SyntaxNode): string | null {
    if (node.type !== "call") return null;

    const funcNode = node.childForFieldName("function");
    if (!funcNode) return null;

    // Direct call: factorial(n), sorted(arr)
    if (funcNode.type === "identifier") {
      return funcNode.text;
    }

    // Method call: arr.sort() → attribute node
    if (funcNode.type === "attribute") {
      return funcNode.text;
    }

    return null;
  }
}
