# Umhlawati Project Directives

> The "brain" for any AI agent operating in this repository. Read this first,
> every session, before touching code.

## Project Overview

Umhlawati is an AI-powered development ecosystem. Every component runs and is
tested **offline** — no API keys are required to try it. It bundles five layers,
each self-contained and independently runnable:

- A **prompt library** of reusable planning and build workflows (`/prompts/`).
- **Skills** — self-contained, executable automation recipes (`/skills/`).
- A **custom MCP server** that exposes local project context to any MCP client
  over stdio (`/mcp-server/`).
- An **agent layer** — the Hermes orchestrator plus an autonomous LLM-as-judge
  critic loop (`/agent/`).
- The **BLAST** application framework — a runnable Express API + vanilla-JS
  frontend for shipping real products (`/src/`).

Note: the repository directory is named `BLAST-framework` and the default branch
is `main`; internally the product is referred to as "Umhlawati".

## Folder Structure

| Path                        | Purpose                                                              |
| --------------------------- | ------------------------------------------------------------------- |
| `/prompts/`                 | Reusable prompt workflows (Plan Mode, Website Build, Critic, Debug). |
| `/skills/`                  | Executable `SKILL.md` recipes + their helper scripts.               |
| `/skills/context-digest/`   | `SKILL.md` + `digest.js` — compact Markdown repo digest for LLMs.   |
| `/mcp-server/`              | Custom Model Context Protocol server (stdio transport, sandboxed).  |
| `/agent/`                   | Hermes orchestrator + the LLM-as-judge critic loop.                 |
| `/src/`                     | BLAST application code (`backend/` + `frontend/`).                  |
| `/src/backend/`             | Express API: JWT-style auth + Stripe-stub payments + in-memory store. |
| `/src/frontend/`            | Minimal vanilla-JS client (no build step).                         |

Each module (`mcp-server`, `agent`, `src/backend`) has its own `package.json`,
its own README, and its own tests. There is **no root-level `package.json`** —
install and run dependencies per-module.

## Runtime & Toolchain

- **Node.js >= 18** everywhere (uses built-in `fetch`, `crypto`, `randomUUID`).
- All JavaScript is **ESM** (`"type": "module"`); use `import`/`export`, not
  `require`. Use `.js` extensions in relative imports.
- Dependencies are deliberately minimal: `express` (backend), and
  `@modelcontextprotocol/sdk` + `zod` (MCP server). The agent layer and skills
  have **zero runtime dependencies** — including a hand-rolled `.env` loader
  (`agent/env.js`) and stdlib-only auth (`src/backend/auth.js`).

## The Five Layers in Detail

### 1. Prompts (`/prompts/`)

Plain-Markdown workflows you load by pointing the agent at the file. They are
prompts, not code — no execution.

- `plan-mode.md` — architect-before-code; outputs a structured technical spec
  and stops for approval before writing code.
- `website-build.md` — 3-step competitor-intel → design-brief → ship system.
- `critic-review.md` — the LLM-as-judge rubric. **This file is loaded at runtime
  by the agent's critic loop** (`agent/critic-loop.js`), so its JSON output
  contract (`verdict`/`score`/`issues`/`summary`) is a real interface, not just
  documentation — do not change its shape without updating the loop.
- `debug.md` — methodical, one-root-cause-at-a-time failure isolation.

### 2. Skills (`/skills/`)

Executable recipes. Each skill is a directory with a `SKILL.md` (YAML
front-matter: `name`, `description`, `trigger`) plus helper scripts.

- `context-digest/` — `node skills/context-digest/digest.js [projectRoot] [headLines]`
  walks a project and emits a single Markdown digest (file tree + head of each
  text file) to stdout. Skips `node_modules`, `.git`, build output, binaries,
  and files > 256 KB.

### 3. MCP Server (`/mcp-server/`)

A **read-only, sandboxed** MCP server (stdio transport) exposing local project
context to any MCP client (Claude Code, etc.). Exposes three tools:

| Tool                 | Args        | Returns                              |
| -------------------- | ----------- | ------------------------------------ |
| `list_project_files` | `subPath?`  | All files under the path             |
| `read_project_file`  | `filePath`  | UTF-8 contents (≤ 256 KB)            |
| `search_project`     | `query`     | Matching `file:line: text` (≤ 100)   |

Security invariants (in `server.js`) — preserve these when editing:
- Every path is resolved against `MCP_PROJECT_ROOT` via `resolveInsideRoot`;
  traversal (`../`) escaping the root is rejected.
- `IGNORED_DIRS` (`node_modules`, `.git`, `dist`, `build`, `.next`, `out`,
  `coverage`, `.cache`) are never traversed.
- Files > `MAX_FILE_BYTES` (256 KB) are refused; search caps at 100 hits.
- **stdout is reserved for the MCP protocol** — all logging goes to stderr.

### 4. Agent Layer (`/agent/`)

Hermes (CLI orchestrator) + the autonomous critic loop — the self-correcting core.

| File             | Role                                                                 |
| ---------------- | ------------------------------------------------------------------- |
| `hermes.js`      | CLI entry: runs a task through the loop, prints the final artifact. |
| `critic-loop.js` | `runCriticLoop()` — generate → critique → revise until pass/budget. |
| `provider.js`    | Pluggable LLM provider: `openrouter`, `anthropic`, `ollama`, `mock`. |
| `env.js`         | Zero-dependency repo-root `.env` loader (never overwrites real env). |
| `test.js`        | Offline tests using the deterministic `mock` provider.             |

How the loop works: generate a first draft → critique it against
`prompts/critic-review.md` (model returns JSON verdict) → if `revise`, apply the
fixes and re-critique → stop on `pass` or when the iteration budget (default 3)
is reached. The final artifact goes to **stdout**; progress logs go to
**stderr**, so `node hermes.js "..." > out.js` yields just the code.

The `mock` provider is the default when no `LLM_PROVIDER` is set: it is
deterministic and demands exactly one revision before passing, so the whole
orchestration is exercisable offline. Keep this behavior — the agent tests
depend on it.

### 5. BLAST Application (`/src/`)

The application framework: **B**ackend · **L**ogic · **A**uth · **S**torage ·
**T**ransactions. Runs entirely on in-memory + stub services out of the box;
goes live via environment variables with **no code changes**.

**Backend** (`src/backend/`, Express, ESM):
- `app.js` — `createApp({ store })` **factory** (so tests inject a fresh store
  and never bind a port). Routes:
  - `POST /api/auth/register` `{ email, password }` → `{ token, user }`
  - `POST /api/auth/login` `{ email, password }` → `{ token, user }`
  - `GET  /api/me` (auth) → `{ user }`
  - `POST /api/checkout` (auth) `{ priceCents, productName? }` → `{ id, url, mode }`
  - `POST /api/webhook` (Stripe/stub event) → `{ received: true }`
  - `GET  /api/payments` (auth) → `{ payments }`
  - `GET  /health` → `{ ok, paymentsMode }`
- `auth.js` — password hashing (scrypt, salted, constant-time verify) and
  JWT-style HS256 tokens, using **only** Node's `crypto`. `requireAuth`
  middleware attaches `req.user`.
- `payments.js` — Stripe-compatible. If `STRIPE_SECRET_KEY` is set **and** the
  `stripe` package is installed, uses real Stripe Checkout; otherwise a
  deterministic **stub** (`cs_stub_...` session ids). The stub's contract
  mirrors the parts of Stripe used, so the live-mode swap is config-only.
- `store.js` — `createInMemoryStore()`. Small async interface intentionally
  shaped so it can be swapped for Postgres/Supabase without touching routes.
- `server.js` — entry point: mounts the API and serves `../frontend` statically.

**Frontend** (`src/frontend/`): `index.html` + `styles.css` + `app.js`, plain
vanilla JS, no build step. In stub mode it self-completes checkout by posting the
webhook so the demo works end-to-end without Stripe.

## Quick Start / Common Commands

Each module is self-contained. From the repo root:

```bash
# MCP server — install, then smoke-test (exercises every tool + sandboxing)
cd mcp-server && npm install && npm run smoke

# Agent — offline tests, then a dry run with the deterministic mock provider
cd agent && npm test
node hermes.js "Write a function that validates an email address"
# ...or with a real provider:
LLM_PROVIDER=openrouter LLM_API_KEY=sk-... node hermes.js "<task>"

# BLAST app — install, test, serve
cd src/backend && npm install && npm test
PORT=3000 npm start          # then open http://localhost:3000

# Context-digest skill
node skills/context-digest/digest.js . 15 > project-digest.md
```

Tests are plain `node test.js` scripts using `node:assert/strict` — **no test
framework**. They run in-process and offline, and exit non-zero on failure.
Current status: **5/5 agent tests pass**, **11/11 backend tests pass**, MCP smoke
test passes. When you change behavior, update the matching test in the same
module and keep it passing.

## Coding Standards

- Write clean, modular, self-documenting code following SOLID principles.
- Comments explain **why** a non-obvious decision was made, not **what** the code
  does. The existing files model this well — match their comment density and the
  file-top block-comment style.
- Validate all inputs at system boundaries (CLI args, env vars, network, request
  bodies, webhooks). See `app.js` (`EMAIL_RE`, password length, `priceCents`
  integer check) and `server.js`'s `resolveInsideRoot`.
- Prefer non-blocking I/O; handle failures explicitly — no silent catches
  (the deliberate skip-on-unreadable-file `catch`es in the walkers are the
  documented exception).
- Strict typing everywhere it is available (Python type hints; TypeScript strict
  mode if/when TS is added). This codebase is currently plain ESM JavaScript.
- No hardcoded secrets. Everything sensitive loads from environment variables.

## Secrets & Configuration

- Copy `.env.example` to `.env` at the repo root and fill in real values locally.
- `.env` is git-ignored (see `.gitignore`) and **must never be committed**.
- The agent reads the repo-root `.env` via `agent/env.js`, which never overwrites
  variables already present in the real environment.
- Key variables (see `.env.example`):
  - Agent LLM: `LLM_PROVIDER` (`openrouter`|`anthropic`|`ollama`|`mock`),
    `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`.
  - MCP server: `MCP_PROJECT_ROOT` (the only directory it may read).
  - BLAST app: `AUTH_SECRET` (long random string — the default is dev-only and
    insecure), `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (+ `npm i stripe`)
    to switch payments live, `DATABASE_URL` to swap in a real store, `APP_URL`,
    `PORT`.

## Git Workflow

- Commit small, logical, atomic chunks of work.
- Use Conventional Commits: `type(scope): lower-case description`.
  - Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- **Never push directly to `main`** — branch, then open a PR.

## How To Use The Prompt Library

Point the agent at a prompt file to load a workflow, e.g.:

> "Read `/prompts/plan-mode.md` and use it to architect a user-auth flow."

## Guardrails For AI Agents

- Preserve the offline-first guarantee: any new feature must still run and test
  without API keys (add a stub/mock path where an external service is involved).
- Preserve the MCP sandbox invariants and the "stdout is protocol-only" rule.
- Don't change `prompts/critic-review.md`'s JSON contract without updating
  `agent/critic-loop.js` and its tests.
- Keep dependencies minimal and justified; prefer Node stdlib.
- The store interface is a seam — keep new persistence behind it, not in routes.
