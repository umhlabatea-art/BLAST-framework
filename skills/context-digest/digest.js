#!/usr/bin/env node
/**
 * context-digest — produce a compact Markdown digest of a project for use as
 * LLM grounding context. See SKILL.md for usage.
 *
 *   node digest.js [projectRoot] [headLines]
 */
import { promises as fs } from "node:fs";
import path from "node:path";

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
const TEXT_EXT = new Set([
  ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md",
  ".py", ".rb", ".go", ".rs", ".java", ".html", ".css", ".yml", ".yaml",
  ".txt", ".sh", ".env",
]);
const MAX_FILE_BYTES = 256 * 1024;

const root = path.resolve(process.argv[2] || ".");
const headLines = Number.parseInt(process.argv[3] ?? "20", 10);

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (IGNORED_DIRS.has(e.name)) continue;
      await walk(path.join(dir, e.name), out);
    } else if (e.isFile()) {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

function isText(file) {
  return TEXT_EXT.has(path.extname(file).toLowerCase());
}

async function main() {
  const files = (await walk(root)).sort();
  const rel = (f) => path.relative(root, f) || ".";

  const lines = [];
  lines.push(`# Project Digest: ${path.basename(root)}`, "");
  lines.push(`Generated for ${files.length} files.`, "");

  lines.push("## File tree", "", "```");
  for (const f of files) lines.push(rel(f));
  lines.push("```", "");

  lines.push("## File summaries", "");
  for (const f of files) {
    if (!isText(f)) {
      lines.push(`### ${rel(f)}`, "_(binary or unsupported — skipped)_", "");
      continue;
    }
    let text;
    try {
      const stat = await fs.stat(f);
      if (stat.size > MAX_FILE_BYTES) {
        lines.push(`### ${rel(f)}`, "_(too large — skipped)_", "");
        continue;
      }
      text = await fs.readFile(f, "utf8");
    } catch {
      continue;
    }
    const all = text.split("\n");
    const head = all.slice(0, headLines).join("\n");
    const lang = path.extname(f).slice(1) || "";
    lines.push(
      `### ${rel(f)}  _(${all.length} lines)_`,
      "",
      "```" + lang,
      head,
      all.length > headLines ? "…" : "",
      "```",
      ""
    );
  }

  process.stdout.write(lines.join("\n"));
}

main().catch((err) => {
  console.error("context-digest failed:", err);
  process.exit(1);
});
