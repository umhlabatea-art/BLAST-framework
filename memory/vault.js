/**
 * Obsidian vault loader + note parser.
 *
 * An Obsidian vault is just a directory of Markdown files. This module walks
 * the vault, skips Obsidian/system folders, and parses each note into a
 * structured object the memory index can consume:
 *
 *   { id, path, title, tags[], links[], frontmatter{}, body, raw }
 *
 * Parsing is dependency-free:
 *   - YAML frontmatter (the `---` block) is read with a minimal parser that
 *     handles `key: value`, inline `[a, b]` lists, and block `- item` lists.
 *   - `#tags` are extracted from the body (and merged with frontmatter tags).
 *   - `[[wikilinks]]` (with optional `|alias`) are extracted as outbound links.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const IGNORED_DIRS = new Set([
  ".git",
  ".obsidian", // Obsidian config/workspace
  ".trash", // Obsidian trash
  "node_modules",
  ".cache",
]);

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      await walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".md") {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

/** Minimal YAML-ish frontmatter parser. Returns a plain object. */
export function parseFrontmatter(block) {
  const fm = {};
  const lines = block.split("\n");
  let currentListKey = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line.trim()) continue;

    // Continuation of a block list: "  - item"
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentListKey) {
      fm[currentListKey].push(stripQuotes(listItem[1].trim()));
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const value = kv[2].trim();

    if (value === "") {
      // Either an empty value or the start of a block list on following lines.
      fm[key] = [];
      currentListKey = key;
      continue;
    }
    currentListKey = null;

    // Inline list: [a, b, c]
    const inlineList = value.match(/^\[(.*)\]$/);
    if (inlineList) {
      fm[key] = inlineList[1]
        .split(",")
        .map((s) => stripQuotes(s.trim()))
        .filter(Boolean);
      continue;
    }

    fm[key] = stripQuotes(value);
  }

  // Normalize empty block lists that never got items back to scalar "".
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v) && v.length === 0) fm[k] = "";
  }
  return fm;
}

function stripQuotes(s) {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}

/** Split a raw note into [frontmatterObject, body]. */
function splitFrontmatter(raw) {
  if (!raw.startsWith("---")) return [{}, raw];
  // Frontmatter ends at the next line that is exactly "---".
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return [{}, raw];
  const block = raw.slice(3, end).replace(/^\n/, "");
  // Skip past the closing "---" and its trailing newline.
  let bodyStart = end + 4;
  if (raw[bodyStart] === "\n") bodyStart += 1;
  return [parseFrontmatter(block), raw.slice(bodyStart)];
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map((t) => String(t).replace(/^#/, ""));
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, ""))
      .filter(Boolean);
  }
  return [];
}

/** Parse a single note's raw text into a structured record. */
export function parseNote({ root, file, raw }) {
  const [frontmatter, body] = splitFrontmatter(raw);

  const tags = new Set(normalizeTags(frontmatter.tags));
  // Inline #tags in the body (avoid markdown headings: require non-# preceding).
  for (const m of body.matchAll(/(?:^|[^\w#])#([A-Za-z0-9_][\w/-]*)/g)) {
    tags.add(m[1]);
  }

  const links = [];
  for (const m of body.matchAll(/\[\[([^\]]+)\]\]/g)) {
    links.push(m[1].split("|")[0].split("#")[0].trim());
  }

  const id = path.relative(root, file);
  const title =
    (typeof frontmatter.title === "string" && frontmatter.title) ||
    path.basename(file, ".md");

  return {
    id,
    path: file,
    title,
    tags: [...tags],
    links,
    frontmatter,
    body: body.trim(),
    raw,
  };
}

/** Load and parse every Markdown note in a vault. */
export async function loadVault(vaultPath) {
  const root = path.resolve(vaultPath);
  const stat = await fs.stat(root).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Vault path is not a directory: ${vaultPath}`);
  }
  const files = (await walk(root)).sort();
  const notes = [];
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    notes.push(parseNote({ root, file, raw }));
  }
  return notes;
}
