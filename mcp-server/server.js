#!/usr/bin/env node
/**
 * Umhlawati MCP server.
 *
 * Exposes read-only project context to any MCP client (Claude Code, etc.) over
 * the stdio transport. Every filesystem operation is sandboxed to a single root
 * directory so a client can never read outside the project.
 *
 * Tools:
 *   - list_project_files : list files under a sub-path (respects ignore globs)
 *   - read_project_file  : read a single text file
 *   - search_project     : substring search across project files
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";

// --- Configuration -------------------------------------------------------

// The single directory the server is allowed to touch. Resolved once, up front.
const PROJECT_ROOT = path.resolve(process.env.MCP_PROJECT_ROOT || process.cwd());

// Directories we never want to traverse or surface.
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "out",
  "coverage",
  ".cache",
]);

const MAX_FILE_BYTES = 256 * 1024; // refuse to read anything larger than 256 KB
const MAX_SEARCH_RESULTS = 100;

// --- Safety: confine every path to PROJECT_ROOT --------------------------

/**
 * Resolve a user-supplied relative path against PROJECT_ROOT and guarantee the
 * result stays inside the sandbox. Throws on traversal attempts.
 */
function resolveInsideRoot(relativePath) {
  const target = path.resolve(PROJECT_ROOT, relativePath || ".");
  const rel = path.relative(PROJECT_ROOT, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path escapes the project root: ${relativePath}`);
  }
  return target;
}

// --- Filesystem helpers --------------------------------------------------

async function walk(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      await walk(path.join(dir, entry.name), results);
    } else if (entry.isFile()) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function toRel(absPath) {
  return path.relative(PROJECT_ROOT, absPath) || ".";
}

// --- Server definition ---------------------------------------------------

const server = new McpServer({
  name: "umhlawati-mcp",
  version: "0.1.0",
});

server.registerTool(
  "list_project_files",
  {
    title: "List project files",
    description:
      "List all files under a sub-path of the project (ignored dirs excluded).",
    inputSchema: {
      subPath: z
        .string()
        .optional()
        .describe("Sub-path relative to project root. Defaults to root."),
    },
  },
  async ({ subPath }) => {
    const dir = resolveInsideRoot(subPath ?? ".");
    const files = (await walk(dir)).map(toRel).sort();
    return {
      content: [
        {
          type: "text",
          text:
            files.length > 0
              ? files.join("\n")
              : "(no files found under that path)",
        },
      ],
    };
  }
);

server.registerTool(
  "read_project_file",
  {
    title: "Read project file",
    description: "Read the UTF-8 text contents of a single project file.",
    inputSchema: {
      filePath: z
        .string()
        .describe("File path relative to the project root."),
    },
  },
  async ({ filePath }) => {
    const target = resolveInsideRoot(filePath);
    const stat = await fs.stat(target);
    if (!stat.isFile()) throw new Error(`Not a file: ${filePath}`);
    if (stat.size > MAX_FILE_BYTES) {
      throw new Error(
        `File too large (${stat.size} bytes, limit ${MAX_FILE_BYTES}).`
      );
    }
    const text = await fs.readFile(target, "utf8");
    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "search_project",
  {
    title: "Search project",
    description:
      "Case-insensitive substring search across all project files. Returns matching lines with file:line.",
    inputSchema: {
      query: z.string().min(1).describe("Text to search for."),
    },
  },
  async ({ query }) => {
    const needle = query.toLowerCase();
    const files = await walk(PROJECT_ROOT);
    const hits = [];
    for (const file of files) {
      let text;
      try {
        const stat = await fs.stat(file);
        if (stat.size > MAX_FILE_BYTES) continue;
        text = await fs.readFile(file, "utf8");
      } catch {
        continue; // skip binary / unreadable files
      }
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(needle)) {
          hits.push(`${toRel(file)}:${i + 1}: ${lines[i].trim()}`);
          if (hits.length >= MAX_SEARCH_RESULTS) break;
        }
      }
      if (hits.length >= MAX_SEARCH_RESULTS) break;
    }
    return {
      content: [
        {
          type: "text",
          text: hits.length ? hits.join("\n") : `No matches for "${query}".`,
        },
      ],
    };
  }
);

// --- Boot ----------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe to log to; stdout is reserved for the MCP protocol.
  console.error(`[umhlawati-mcp] ready. root=${PROJECT_ROOT}`);
}

main().catch((err) => {
  console.error("[umhlawati-mcp] fatal:", err);
  process.exit(1);
});
