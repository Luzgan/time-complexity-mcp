#!/usr/bin/env node

/**
 * Creates a self-contained release bundle for the current platform.
 *
 * Usage: node scripts/package-release.mjs <artifact-name>
 * Example: node scripts/package-release.mjs time-complexity-mcp-darwin-arm64
 *
 * Output: release/<artifact-name>-v<version>.tar.gz (or .zip on Windows)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const artifactName = process.argv[2];
if (!artifactName) {
  console.error("Usage: node scripts/package-release.mjs <artifact-name>");
  process.exit(1);
}

const rootDir = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"),
);
const version = pkg.version;
const archiveName = `${artifactName}-v${version}`;
const releaseDir = path.join(rootDir, "release");
const stageDir = path.join(releaseDir, archiveName);

console.log(`Packaging ${archiveName} ...`);

// Clean and create staging directory
fs.rmSync(stageDir, { recursive: true, force: true });
fs.mkdirSync(stageDir, { recursive: true });

// ── 1. Copy dist/ ──────────────────────────────────────────────
console.log("  Copying dist/ ...");
fs.cpSync(path.join(rootDir, "dist"), path.join(stageDir, "dist"), {
  recursive: true,
});

// ── 2. Write stripped package.json ──────────────────────────────
const prodPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  type: pkg.type,
  main: pkg.main,
  license: pkg.license,
};
fs.writeFileSync(
  path.join(stageDir, "package.json"),
  JSON.stringify(prodPkg, null, 2) + "\n",
);

// ── 3. Copy node_modules/ ──────────────────────────────────────
console.log("  Copying node_modules/ ...");
fs.cpSync(
  path.join(rootDir, "node_modules"),
  path.join(stageDir, "node_modules"),
  { recursive: true },
);

// ── 4. Copy vendor/tree-sitter-dart/ (runtime files only) ──────
console.log("  Copying vendor/tree-sitter-dart/ ...");
const dartSrc = path.join(rootDir, "vendor", "tree-sitter-dart");
const dartDest = path.join(stageDir, "vendor", "tree-sitter-dart");

// Create directory structure
for (const dir of [
  "bindings/node",
  "build/Release",
  "src",
]) {
  fs.mkdirSync(path.join(dartDest, dir), { recursive: true });
}

// Copy runtime files
fs.copyFileSync(
  path.join(dartSrc, "package.json"),
  path.join(dartDest, "package.json"),
);
fs.copyFileSync(
  path.join(dartSrc, "bindings/node/index.js"),
  path.join(dartDest, "bindings/node/index.js"),
);
fs.copyFileSync(
  path.join(dartSrc, "src/node-types.json"),
  path.join(dartDest, "src/node-types.json"),
);

// Copy the compiled .node binary
const dartBuildDir = path.join(dartSrc, "build/Release");
for (const file of fs.readdirSync(dartBuildDir)) {
  if (file.endsWith(".node")) {
    fs.copyFileSync(
      path.join(dartBuildDir, file),
      path.join(dartDest, "build/Release", file),
    );
  }
}

// Copy vendor's node_modules (node-gyp-build, node-addon-api)
fs.cpSync(
  path.join(dartSrc, "node_modules"),
  path.join(dartDest, "node_modules"),
  { recursive: true },
);

// ── 5. Prune node_modules/ ─────────────────────────────────────
console.log("  Pruning node_modules/ ...");
const nmDir = path.join(stageDir, "node_modules");

// Remove devDependencies
const devDeps = Object.keys(pkg.devDependencies || {});
for (const dep of devDeps) {
  rmDir(path.join(nmDir, dep));
}
rmDir(path.join(nmDir, "@types"));

// Remove build tooling that's not needed at runtime
for (const dep of ["@rollup", "@esbuild", "esbuild", "fsevents"]) {
  rmDir(path.join(nmDir, dep));
}

// Remove other-platform prebuilds
const currentPlatformArch = `${process.platform}-${process.arch}`;
pruneOtherPlatformPrebuilds(nmDir, currentPlatformArch);

// Remove unnecessary files from all packages
pruneFiles(nmDir);

// ── 6. Create archive ──────────────────────────────────────────
const isWindows = process.platform === "win32";
const archiveExt = isWindows ? ".zip" : ".tar.gz";
const archivePath = path.join(releaseDir, `${archiveName}${archiveExt}`);

console.log(`  Creating ${archiveName}${archiveExt} ...`);

if (isWindows) {
  execSync(
    `powershell Compress-Archive -Path "${stageDir}\\*" -DestinationPath "${archivePath}"`,
    { stdio: "inherit" },
  );
} else {
  execSync(`tar -czf "${archivePath}" -C "${releaseDir}" "${archiveName}"`, {
    stdio: "inherit",
  });
}

// Clean up staging directory
fs.rmSync(stageDir, { recursive: true, force: true });

// Report
const stats = fs.statSync(archivePath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
console.log(`\nDone: ${archivePath} (${sizeMB} MB)`);

// ── Helpers ────────────────────────────────────────────────────

function rmDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

/**
 * Remove prebuilds/ directories for platforms other than the current one.
 */
function pruneOtherPlatformPrebuilds(nmDir, keepPlatform) {
  walkPackages(nmDir, (pkgDir) => {
    const prebuildsDir = path.join(pkgDir, "prebuilds");
    if (!fs.existsSync(prebuildsDir)) return;

    try {
      for (const entry of fs.readdirSync(prebuildsDir)) {
        if (entry !== keepPlatform) {
          rmDir(path.join(prebuildsDir, entry));
        }
      }
    } catch {
      // ignore
    }
  });
}

/**
 * Remove unnecessary files from node_modules packages.
 */
function pruneFiles(nmDir) {
  const deleteNames = new Set([
    // Directories
    "test",
    "tests",
    "__tests__",
    "docs",
    "doc",
    "example",
    "examples",
    ".cache",
    // Build artifacts not needed at runtime
    "build/config.gypi",
    "build/Makefile",
  ]);

  const deleteExtensions = new Set([
    ".md",
    ".markdown",
    ".map",
    ".ts.map",
    ".gyp",
    ".gypi",
  ]);

  const deletePatterns = [
    /^CHANGELOG/i,
    /^HISTORY/i,
    /^LICENSE/i,
    /^LICENCE/i,
    /^NOTICE/i,
    /^AUTHORS/i,
    /^CONTRIBUTORS/i,
    /^\.eslintrc/,
    /^\.prettierrc/,
    /^jest\.config/,
    /^tsconfig/,
    /^tsdoc/,
    /^Makefile$/,
  ];

  // C/C++ source files (already compiled into .node binaries)
  const cSourceFiles = new Set([
    "parser.c",
    "scanner.c",
    "scanner.cc",
    "binding.cc",
    "alloc.c",
    "stack.c",
    "subtree.c",
    "node.c",
    "parser.cc",
  ]);

  walkPackages(nmDir, (pkgDir) => {
    try {
      for (const entry of fs.readdirSync(pkgDir)) {
        const fullPath = path.join(pkgDir, entry);

        // Delete known directory names
        if (deleteNames.has(entry) && isDir(fullPath)) {
          rmDir(fullPath);
          continue;
        }

        // Delete by extension
        const ext = path.extname(entry);
        if (deleteExtensions.has(ext) && !isDir(fullPath)) {
          fs.rmSync(fullPath, { force: true });
          continue;
        }

        // Delete by pattern
        if (deletePatterns.some((p) => p.test(entry)) && !isDir(fullPath)) {
          fs.rmSync(fullPath, { force: true });
          continue;
        }

        // Delete C source files in src/ directories
        if (entry === "src" && isDir(fullPath)) {
          try {
            for (const srcFile of fs.readdirSync(fullPath)) {
              if (cSourceFiles.has(srcFile)) {
                fs.rmSync(path.join(fullPath, srcFile), { force: true });
              }
            }
          } catch {
            // ignore
          }
        }

        // Delete build intermediates (obj.target, .deps)
        if (entry === "build" && isDir(fullPath)) {
          try {
            for (const buildEntry of fs.readdirSync(fullPath)) {
              if (buildEntry === "Makefile" || buildEntry.endsWith(".mk")) {
                fs.rmSync(path.join(fullPath, buildEntry), { force: true });
              }
              const buildPath = path.join(fullPath, buildEntry);
              if (
                (buildEntry === "Release" || buildEntry === "Debug") &&
                isDir(buildPath)
              ) {
                for (const relEntry of fs.readdirSync(buildPath)) {
                  if (
                    relEntry === ".deps" ||
                    relEntry === "obj.target" ||
                    relEntry === "obj"
                  ) {
                    rmDir(path.join(buildPath, relEntry));
                  }
                }
              }
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore inaccessible directories
    }
  });
}

/**
 * Walk top-level packages in node_modules (handles scoped packages).
 */
function walkPackages(nmDir, callback) {
  try {
    for (const entry of fs.readdirSync(nmDir)) {
      const fullPath = path.join(nmDir, entry);
      if (!isDir(fullPath)) continue;

      if (entry.startsWith("@")) {
        // Scoped package — walk one level deeper
        for (const sub of fs.readdirSync(fullPath)) {
          const subPath = path.join(fullPath, sub);
          if (isDir(subPath)) {
            callback(subPath);
          }
        }
      } else if (entry !== ".package-lock.json") {
        callback(fullPath);
      }
    }
  } catch {
    // ignore
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
