/**
 * Autonomous critic loop (LLM-as-judge).
 *
 * Pattern: generate -> critique -> (revise -> critique)* -> done.
 * A draft is repeatedly judged against the critic rubric until it passes or the
 * iteration budget is exhausted. This is the self-correcting core of Hermes.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const CRITIC_PROMPT_PATH = path.resolve(here, "..", "prompts", "critic-review.md");

/** Extract the first balanced JSON object from arbitrary model text. */
export function extractJson(text) {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in critic output.");
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1));
      }
    }
  }
  throw new Error("Unbalanced JSON in critic output.");
}

async function loadCriticPrompt() {
  try {
    return await fs.readFile(CRITIC_PROMPT_PATH, "utf8");
  } catch {
    // Fallback so the loop still works if the prompt file is missing.
    return 'Review the code. Return JSON {"verdict":"pass|revise","score":0-100,"issues":[],"summary":""}.';
  }
}

async function generateDraft(provider, task) {
  return provider.complete({
    system: "You are a senior engineer. Produce only the code requested, no prose.",
    user: `Task:\n${task}\n\nWrite the implementation.`,
  });
}

async function critique(provider, criticPrompt, task, draft) {
  const raw = await provider.complete({
    system: criticPrompt,
    user: `Original task:\n${task}\n\nCode under review:\n\`\`\`\n${draft}\n\`\`\`\n\nReturn only the JSON verdict.`,
    temperature: 0,
  });
  return extractJson(raw);
}

async function revise(provider, task, draft, issues) {
  const issueList = (issues || [])
    .map((i) => `- [${i.severity}] ${i.location}: ${i.problem} -> ${i.fix}`)
    .join("\n");
  return provider.complete({
    system: "You are a senior engineer. Apply the fixes and return only the corrected code.",
    user: `Task:\n${task}\n\nCurrent code:\n\`\`\`\n${draft}\n\`\`\`\n\nIssues to fix:\n${issueList}\n\nReturn the revised code.`,
  });
}

/**
 * @param {object}   opts
 * @param {object}   opts.provider       provider with .complete()
 * @param {string}   opts.task           the task to implement
 * @param {number}   [opts.maxIterations=3]
 * @param {function} [opts.onIteration]  callback({ iteration, verdict })
 * @returns {Promise<{ code: string, verdict: object, iterations: number, passed: boolean }>}
 */
export async function runCriticLoop({
  provider,
  task,
  maxIterations = 3,
  onIteration,
}) {
  if (!provider) throw new Error("provider is required");
  if (!task || !task.trim()) throw new Error("task is required");

  const criticPrompt = await loadCriticPrompt();
  let draft = await generateDraft(provider, task);
  let lastVerdict = null;

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const verdict = await critique(provider, criticPrompt, task, draft);
    lastVerdict = verdict;
    if (typeof onIteration === "function") onIteration({ iteration, verdict });

    if (verdict.verdict === "pass") {
      return { code: draft, verdict, iterations: iteration, passed: true };
    }
    draft = await revise(provider, task, draft, verdict.issues);
  }

  return {
    code: draft,
    verdict: lastVerdict,
    iterations: maxIterations,
    passed: false,
  };
}
