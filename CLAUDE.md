# Time Complexity MCP

An MCP (Model Context Protocol) server that performs static analysis on source code to estimate Big-O time complexity. It parses code into ASTs using tree-sitter, detects loops, recursion, and known stdlib method calls, then reports per-function complexity with line-level annotations. Designed to be used by AI coding assistants (Claude Code, GitHub Copilot) as a tool during code review and development.

## Tech Stack

- **TypeScript** (ESM, `"type": "module"`) compiled with `tsc`
- **tree-sitter** for language-agnostic AST parsing (native NAPI bindings)
- **@modelcontextprotocol/sdk** for the MCP server
- **zod** for input validation
- **vitest** for testing

## Project Structure

```
src/
  index.ts                  # Entry point — creates stdio MCP transport
  server.ts                 # MCP server definition & tool registration
  analyzer/
    types.ts                # Core types (BigOComplexity, FunctionNode, etc.)
    base-analyzer.ts        # Abstract base class — the analysis algorithm
    complexity.ts           # Complexity arithmetic (max, multiply, fromDepth)
  languages/
    index.ts                # Language registry — maps extensions to analyzers
    javascript/             # JS/TS analyzer (tree-sitter-javascript/typescript)
    dart/                   # Dart analyzer (vendor/tree-sitter-dart)
    kotlin/                 # Kotlin analyzer (tree-sitter-kotlin)
    java/                   # Java analyzer (tree-sitter-java)
    python/                 # Python analyzer (tree-sitter-python)
    php/                    # PHP analyzer (tree-sitter-php)
    go/                     # Go analyzer (tree-sitter-go)
  tools/                    # MCP tool implementations (analyze-file, analyze-function, analyze-github-repo, etc.)
  utils/                    # File I/O & output formatting helpers
vendor/
  tree-sitter-dart/         # Custom NAPI binding for Dart grammar (see below)
tests/
  analyzer.test.ts          # JS/TS test suite
  dart-analyzer.test.ts     # Dart test suite
  kotlin-analyzer.test.ts   # Kotlin test suite
  java-analyzer.test.ts     # Java test suite
  python-analyzer.test.ts   # Python test suite
  php-analyzer.test.ts      # PHP test suite
  go-analyzer.test.ts       # Go test suite
  github-repo-analyzer.test.ts  # GitHub repo tool test suite
  fixtures/                 # Sample files for tests (.ts, .dart, .kt, .java, .py, .php, .go)
```

## Adding a New Language

Each language lives in `src/languages/<name>/` with three files:

1. **`node-types.ts`** — AST node type constants for functions and loops
2. **`patterns.ts`** — Known stdlib method complexities (e.g., `.sort` is O(n log n))
3. **`analyzer.ts`** — Class extending `BaseAnalyzer`, implementing 9 template methods:
   - `getGrammar()` — return tree-sitter grammar
   - `getFunctionNodeTypes()` / `getLoopNodeTypes()` — AST node types
   - `getCallNodeTypes()` — AST node types for function/method calls (e.g., `["call_expression"]` for JS/Kotlin, `["method_invocation"]` for Java, `["call"]` for Python)
   - `getKnownMethods()` — known method patterns
   - `extractFunctionName(node)` / `extractParameters(node)` — name & params from AST
   - `isConstantLoop(node)` — detect constant-bound loops (e.g., `for i < 10`)
   - `getCallName(node)` — extract function/method name from call AST node

Then register it in `src/languages/index.ts` (add to registry + `getSupportedLanguages()`).

**Important:** tree-sitter grammars must use NAPI bindings compatible with tree-sitter ^0.21. If an npm grammar uses old NAN bindings (like `tree-sitter-dart` did), you need to create a vendor NAPI binding — see `vendor/tree-sitter-dart/` for the pattern.

If the target language has no `call_expression` node type (like Dart), you will also need to override `detectRecursion`, `classifyRecursion`, `detectKnownCalls`, and `isInsideLoop` in your analyzer subclass.

## Development Workflow

1. **Feature branch** — Create a branch before making any changes
2. **Meaningful commits** — Commit during work with clear descriptions of what changed and why. Always commit as `Luzgan` (`git config user.name "Luzgan"`)
3. **Run tests** — Always run `npm test` after changes. Fix regressions in code, not tests. Only modify tests if changes intentionally affect the tested behavior
4. **Type checking** — Always run `npm run build` (which runs `tsc`). No type errors allowed
5. **Merge** — After feature is complete and green, merge the branch into main and rebuild (`npm run build`), so the MCP server picks up the new code
6. **Update life_manager** - run life_manager mcp in order to update the project there

### Commands

```bash
npm run build       # TypeScript compilation (tsc) — also serves as type checking
npm test            # Run all tests (vitest)
npm run test:watch  # Watch mode for tests
npm run dev         # Run server directly via tsx (no build needed)
```

## Security

- **No arbitrary code execution.** This tool performs static analysis only — it parses code into ASTs and inspects the tree. It never evaluates, runs, or imports the analyzed code.
- **File access is read-only.** The analyzer reads source files to parse them. It does not write, modify, or delete any files.
- **Path validation.** File paths received from MCP tool calls must be validated. Never allow path traversal beyond what the user intends.
- **Native addons.** The tree-sitter grammars are compiled native NAPI addons. Only use grammars from trusted sources. The vendor bindings (`vendor/tree-sitter-dart/`) compile C source from the upstream grammar — review any changes to `binding.cc` or `parser.c` carefully.
- **Network access (opt-in).** The `analyze_github_repo` tool invokes `git clone` as a subprocess to fetch public GitHub repositories. All other tools operate entirely locally over stdio. Clone URLs are restricted to HTTPS GitHub URLs. Cloned content is parsed as ASTs only — never evaluated or executed. Temporary clones are cleaned up after analysis.

## MCP Integration

The server is configured in `.mcp.json` at the project root and exposes 5 tools:

| Tool | Description |
|------|-------------|
| `analyze_file` | Analyze all functions in a single source file |
| `analyze_function` | Analyze a specific function by name or line number |
| `analyze_directory` | Scan a directory and report complexity across the codebase |
| `analyze_github_repo` | Clone a GitHub repo and analyze complexity (requires `git` in PATH) |
| `get_supported_languages` | List supported languages and their file extensions |

For VS Code (Copilot), configure in `.vscode/mcp.json` using `${workspaceFolder}/dist/index.js`.

After code changes, rebuild with `npm run build` and restart the MCP server for changes to take effect.

## GitHub

- **Account:** [Luzgan](https://github.com/Luzgan)
- **Repository:** [Luzgan/time-complexity-mcp](https://github.com/Luzgan/time-complexity-mcp)
