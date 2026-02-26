import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import TypeScriptGrammar from "tree-sitter-typescript";
import {
  BaseAnalyzer,
  type FunctionNodeTypes,
  type LoopNodeTypes,
  type KnownMethodComplexity,
} from "../../analyzer/base-analyzer.js";
import { FUNCTION_TYPES, LOOP_TYPES } from "./node-types.js";
import { KNOWN_METHODS } from "./patterns.js";

type Dialect = "javascript" | "typescript" | "tsx";

export class JavaScriptAnalyzer extends BaseAnalyzer {
  readonly language: string;
  readonly extensions: string[];

  private dialect: Dialect;

  constructor(dialect: Dialect = "javascript") {
    super();
    this.dialect = dialect;

    if (dialect === "javascript") {
      this.language = "JavaScript";
      this.extensions = [".js", ".mjs", ".cjs", ".jsx"];
    } else if (dialect === "typescript") {
      this.language = "TypeScript";
      this.extensions = [".ts"];
    } else {
      this.language = "TSX";
      this.extensions = [".tsx"];
    }
  }

  protected getGrammar(): unknown {
    if (this.dialect === "javascript") return JavaScript;
    if (this.dialect === "typescript") return TypeScriptGrammar.typescript;
    return TypeScriptGrammar.tsx;
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
    // function_declaration / generator_function_declaration -> name child
    if (
      node.type === "function_declaration" ||
      node.type === "generator_function_declaration"
    ) {
      const nameNode = node.childForFieldName("name");
      return nameNode?.text ?? "<anonymous>";
    }

    // method_definition -> name child
    if (node.type === "method_definition") {
      const nameNode = node.childForFieldName("name");
      return nameNode?.text ?? "<anonymous>";
    }

    // arrow_function or function expression -> check parent for variable declarator
    if (node.type === "arrow_function" || node.type === "function" || node.type === "generator_function") {
      const parent = node.parent;
      if (parent?.type === "variable_declarator") {
        const nameNode = parent.childForFieldName("name");
        return nameNode?.text ?? "<anonymous>";
      }
      // assignment: x = function() {}
      if (parent?.type === "assignment_expression") {
        const left = parent.childForFieldName("left");
        return left?.text ?? "<anonymous>";
      }
      // property: { key: function() {} } or { key: () => {} }
      if (parent?.type === "pair") {
        const key = parent.childForFieldName("key");
        return key?.text ?? "<anonymous>";
      }
      return "<anonymous>";
    }

    return "<anonymous>";
  }

  protected extractParameters(node: Parser.SyntaxNode): string[] {
    const params = node.childForFieldName("parameters");
    if (!params) return [];

    const result: string[] = [];
    for (let i = 0; i < params.childCount; i++) {
      const child = params.child(i);
      if (child && child.type !== "," && child.type !== "(" && child.type !== ")") {
        // For typed params (TS), just get the name part
        const nameNode = child.childForFieldName("pattern") ?? child.childForFieldName("name");
        result.push(nameNode?.text ?? child.text);
      }
    }
    return result;
  }

  protected isConstantLoop(node: Parser.SyntaxNode): boolean {
    if (node.type === "for_statement") {
      const condition = node.childForFieldName("condition");
      if (!condition) return false;

      // Look for comparisons with numeric literals: i < 10, i <= 5, etc.
      if (
        condition.type === "binary_expression" ||
        condition.type === "sequence_expression"
      ) {
        const right = condition.childForFieldName("right");
        if (right?.type === "number") return true;
      }
    }

    // for-in/for-of with a literal array: for (const x of [1,2,3])
    if (node.type === "for_in_statement") {
      const right = node.childForFieldName("right");
      if (right?.type === "array") return true;
    }

    return false;
  }

  protected getCallName(node: Parser.SyntaxNode): string | null {
    const fn = node.childForFieldName("function");
    if (!fn) return null;

    // Direct call: foo()
    if (fn.type === "identifier") return fn.text;

    // Member call: obj.method()
    if (fn.type === "member_expression") return fn.text;

    return null;
  }
}
