/**
 * Write notes back into an Obsidian vault — closing the memory loop so the
 * agent can persist decisions and outcomes for future recall.
 *
 * Produces a valid Obsidian note: YAML frontmatter (title, tags, created, plus
 * any extra fields) followed by the Markdown body. Filenames are slugified and
 * de-duplicated so an existing note is never overwritten.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export function slugify(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "note"
  );
}

function toFrontmatter(fields) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(", ")}]`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {object} opts
 * @param {string} opts.vaultPath      target vault root
 * @param {string} opts.title          note title (also seeds the filename)
 * @param {string} opts.body           Markdown body
 * @param {string[]} [opts.tags]
 * @param {object} [opts.frontmatter]  extra frontmatter fields
 * @param {string} [opts.subdir]       sub-folder within the vault
 * @returns {Promise<{ path, id, filename }>}
 */
export async function writeNote({ vaultPath, title, body, tags = [], frontmatter = {}, subdir = "" }) {
  if (!vaultPath) throw new Error("vaultPath is required");
  if (!title || !title.trim()) throw new Error("title is required");
  if (!body || !body.trim()) throw new Error("body is required");

  const root = path.resolve(vaultPath);
  const dir = path.resolve(root, subdir);
  await fs.mkdir(dir, { recursive: true });

  // De-duplicate the filename so we never clobber an existing note.
  const base = slugify(title);
  let filename = `${base}.md`;
  let n = 1;
  while (await exists(path.join(dir, filename))) {
    n += 1;
    filename = `${base}-${n}.md`;
  }

  const fm = toFrontmatter({
    title,
    tags,
    created: new Date().toISOString(),
    ...frontmatter,
  });
  const content = `${fm}\n\n${body.trim()}\n`;
  const full = path.join(dir, filename);
  await fs.writeFile(full, content, "utf8");

  return { path: full, id: path.relative(root, full), filename };
}
