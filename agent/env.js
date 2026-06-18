/**
 * Minimal .env loader (zero dependencies). Reads KEY=VALUE lines from a .env
 * file at the repo root and merges them into process.env without overwriting
 * variables that are already set in the real environment.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, "..");

export async function loadEnv(envPath = path.join(REPO_ROOT, ".env")) {
  let raw;
  try {
    raw = await fs.readFile(envPath, "utf8");
  } catch {
    return {}; // no .env is fine — rely on the real environment / defaults
  }
  const parsed = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // strip inline comments and surrounding quotes
    if (!value.startsWith('"') && !value.startsWith("'")) {
      const hash = value.indexOf(" #");
      if (hash !== -1) value = value.slice(0, hash).trim();
    } else {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return parsed;
}
