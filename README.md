# Time Complexity MCP

An MCP server that estimates Big-O time complexity of your code through static analysis. It parses source files into ASTs using [tree-sitter](https://tree-sitter.github.io/tree-sitter/), detects loops, recursion, and known stdlib calls, then reports per-function complexity with line-level annotations.

Built for AI coding assistants &mdash; works with [Claude Code](https://claude.ai/code) and [GitHub Copilot](https://github.com/features/copilot).

## Supported Languages

| Language | Extensions | Grammar |
|---|---|---|
| JavaScript | `.js`, `.mjs`, `.cjs`, `.jsx` | tree-sitter-javascript |
| TypeScript | `.ts`, `.tsx` | tree-sitter-typescript |
| Dart | `.dart` | vendor NAPI binding |
| Kotlin | `.kt`, `.kts` | tree-sitter-kotlin |
| Java | `.java` | tree-sitter-java |
| Python | `.py` | tree-sitter-python |

## What It Detects

- **Loop nesting** &mdash; `for`, `while`, `do-while` with depth tracking. Constant-bound loops (e.g., `for i in range(10)`) are recognized as O(1).
- **Recursion** &mdash; linear recursion (O(n)) vs branching recursion like fibonacci (O(2^n)).
- **Known stdlib methods** &mdash; `.sort()` as O(n log n), `.filter()/.map()` as O(n), `.push()/.pop()` as O(1), etc. Each language has its own patterns.
- **Combined complexity** &mdash; an O(n) method inside an O(n) loop correctly reports O(n^2).

## Tools

The server exposes 4 MCP tools:

| Tool | Description |
|---|---|
| `analyze_file` | Analyze all functions in a source file. Returns per-function Big-O with reasoning and line annotations. |
| `analyze_function` | Analyze a single function by name or line number. |
| `analyze_directory` | Scan a directory for all supported files. Returns a summary with hotspots (top 5 most complex functions). |
| `get_supported_languages` | List supported languages with file extensions. |

## Setup

### Install from Release (recommended)

Download the prebuilt bundle for your platform from the [latest release](https://github.com/Luzgan/time-complexity-mcp/releases/latest):

| Platform | File |
|---|---|
| macOS (Apple Silicon) | `time-complexity-mcp-darwin-arm64-v*.tar.gz` |
| Linux x64 | `time-complexity-mcp-linux-x64-v*.tar.gz` |
| Linux arm64 | `time-complexity-mcp-linux-arm64-v*.tar.gz` |
| Windows x64 | `time-complexity-mcp-win32-x64-v*.zip` |

Extract and configure:

```bash
# macOS / Linux
tar xzf time-complexity-mcp-darwin-arm64-v*.tar.gz
```

```powershell
# Windows
Expand-Archive time-complexity-mcp-win32-x64-v*.zip
```

No C++ compiler or `npm install` required &mdash; just Node.js 18+.

### Install from Source

Requires Node.js 18+ and a C++ compiler (Xcode CLI tools on macOS, `build-essential` on Linux).

```bash
git clone https://github.com/Luzgan/time-complexity-mcp.git
cd time-complexity-mcp
npm install
npm run build
```

The `postinstall` script automatically builds the vendor Dart grammar.

### Configure with Claude Code

Add to your project's `.mcp.json` (or `~/.claude.json` for global access):

```json
{
  "mcpServers": {
    "time-complexity": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/time-complexity-mcp/dist/index.js"]
    }
  }
}
```

Then restart Claude Code. The tools `analyze_file`, `analyze_function`, `analyze_directory`, and `get_supported_languages` will be available automatically.

### Configure with GitHub Copilot (VS Code)

Add to `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "time-complexity": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}
```

> If the MCP lives outside your workspace, replace `${workspaceFolder}/dist/index.js` with the absolute path.

## Usage Examples

Once configured, your AI assistant can call the tools directly.

### Analyze a file

```
> Analyze the complexity of src/utils/sort.ts
```

Returns each function with its Big-O, reasoning, and line-level annotations:

```
bubbleSort (lines 1-10): O(n^2)
  Found 2 variable-bound loop(s), max nesting depth: 2. Overall: O(n^2).

  Line annotations:
    Line 2: O(n) — for_statement loop (nesting depth: 1)
    Line 3: O(n^2) — for_statement loop (nesting depth: 2)
```

### Analyze a single function

```
> What's the complexity of the fibonacci function in recursion.py?
```

### Scan an entire codebase

```
> Scan src/ for complexity hotspots
```

Returns a summary with the top 5 most complex functions across all files:

```
Files analyzed: 27
Total functions: 150

Breakdown:
  O(1):       102
  O(n):        40
  O(n log n):   1
  O(n^2):       4
  O(n^3):       2
  O(2^n):       1

Hotspots:
  1. src/analyzer/base-analyzer.ts → walk: O(2^n)
  2. src/tools/analyze-directory.ts → analyzeDirectory: O(n^3)
  ...
```

## Architecture

```
src/
  index.ts                  # Entry point — stdio MCP transport
  server.ts                 # MCP tool registration
  analyzer/
    base-analyzer.ts        # Abstract base class (template method pattern)
    types.ts                # Core types (BigOComplexity, FunctionNode, etc.)
    complexity.ts           # Complexity arithmetic (max, multiply, fromDepth)
  languages/
    index.ts                # Language registry
    javascript/             # JS/TS analyzer
    dart/                   # Dart analyzer
    kotlin/                 # Kotlin analyzer
    java/                   # Java analyzer
    python/                 # Python analyzer
  tools/                    # MCP tool implementations
  utils/                    # File I/O & formatting
vendor/
  tree-sitter-dart/         # Custom NAPI binding for Dart grammar
tests/
  *.test.ts                 # Per-language test suites (60 tests total)
  fixtures/                 # Sample source files
```

Each language analyzer implements 9 template methods from `BaseAnalyzer`:

```
getGrammar()              → tree-sitter grammar object
getFunctionNodeTypes()    → AST node types for functions
getLoopNodeTypes()        → AST node types for loops
getCallNodeTypes()        → AST node types for calls (e.g., "call_expression", "method_invocation", "call")
getKnownMethods()         → stdlib method complexity patterns
extractFunctionName()     → function name from AST node
extractParameters()       → parameter names from AST node
isConstantLoop()          → detect constant-bound loops
getCallName()             → function/method name from call node
```

## Development

```bash
npm run build       # Compile TypeScript (also type-checks)
npm test            # Run all 60 tests
npm run test:watch  # Watch mode
npm run dev         # Run server via tsx (no build needed)
```

## Security

- **Static analysis only.** Code is parsed into ASTs and inspected &mdash; never evaluated, executed, or imported.
- **Read-only file access.** Source files are read for parsing. Nothing is written, modified, or deleted.
- **No network access.** The server runs locally over stdio with no outbound requests.
- **Trusted native addons.** Tree-sitter grammars are compiled NAPI addons from verified sources.

## License

MIT
