/**
 * Dart function-related AST node types.
 *
 * In Dart's tree-sitter grammar, top-level and class functions are
 * represented as a `function_signature` (or `method_signature`) node
 * followed by a sibling `function_body` node — they are NOT wrapped
 * in a single parent node like JavaScript's `function_declaration`.
 *
 * We list `function_body` here so `extractFunctions` (overridden in
 * the DartAnalyzer) can pair each body with its preceding signature
 * to extract the function name.
 *
 * `function_expression` covers anonymous function literals like
 * `(x) { return x * 2; }`.
 */
export const FUNCTION_TYPES = [
  "function_body",
  "function_expression",
] as const;

/**
 * Dart loop AST node types.
 *
 * - `for_statement`  — traditional for + for-in
 * - `while_statement`
 * - `do_statement`   — do-while
 */
export const LOOP_TYPES = [
  "for_statement",
  "while_statement",
  "do_statement",
] as const;
