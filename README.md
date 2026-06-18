# Umhlawati

An AI-powered development ecosystem — prompt workflows, automation skills, a
custom MCP server, a self-correcting agent, and a runnable application stack.
Built in four phases; every component runs and is tested offline (no API keys
required to try it).

## Layout

```
umhlawati/
├── CLAUDE.md            # AI operating directives for this repo
├── .env.example         # configuration template
├── prompts/             # Phase 1 — reusable prompt workflows
│   ├── plan-mode.md          architect-before-code
│   ├── website-build.md      3-step competitor → design → ship
│   ├── critic-review.md      LLM-as-judge rubric (drives the agent loop)
│   └── debug.md              methodical failure isolation
├── skills/              # Phase 2 — executable automation recipes
│   └── context-digest/       SKILL.md + runnable digest.js
├── mcp-server/          # Phase 2 — sandboxed MCP server (stdio)
├── agent/               # Phase 3 — Hermes orchestrator + critic loop
│   └── memory-context.js     recalls vault notes to ground tasks
├── memory/              # Phase 5 — Obsidian-vault long-term memory (BM25)
├── src/                 # Phase 4 — BLAST application
│   ├── backend/              Express API: JWT auth + Stripe-stub payments
│   └── frontend/             minimal vanilla-JS client
├── .githooks/           # pre-commit hook: runs the test suites
└── .github/workflows/   # CI: runs every suite on push / PR
```

## Quick start

Each module is self-contained. From the repo root:

```bash
# One-time: enable the pre-commit test hook
npm run setup:hooks

# MCP server
cd mcp-server && npm install && npm run smoke

# Agent (offline, deterministic mock provider)
cd ../agent && npm test && node hermes.js "Write an email validator"

# Memory — point it at your Obsidian vault
node memory/cli.js /path/to/ObsidianVault "stripe webhook handling"

# Agent + memory: recall vault notes to ground a task
MEMORY_VAULT=/path/to/ObsidianVault node agent/hermes.js "Add a refund endpoint"

# BLAST app
cd ../src/backend && npm install && npm test
PORT=3000 npm start          # then open http://localhost:3000
```

## BLAST

The application framework: **B**ackend · **L**ogic · **A**uth · **S**torage ·
**T**ransactions. It runs entirely on in-memory + stub services out of the box.
To go live, set environment variables (see `.env.example`) — no code changes:

- `AUTH_SECRET` — long random string for signing tokens.
- `DATABASE_URL` — switches the store from in-memory to **Postgres/Supabase**
  (the schema is applied automatically on startup). `PGSSL=disable` for a local
  DB without SSL.
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` and `npm i stripe` — switches
  payments from stub to **live Stripe Checkout** with signature-verified webhooks.

## Memory

Long-term memory is backed by an **Obsidian vault** (a folder of Markdown
notes). Choose a ranking backend with `MEMORY_BACKEND`:

- `bm25` (default) — keyword relevance, fully offline.
- `vector` — semantic similarity via pluggable embeddings (`mock`/`openai`/`ollama`).
- `hybrid` — a blend of both.

The vector index is in-memory by default; set `VECTOR_STORE=pinecone` for hosted
recall. With `MEMORY_AUTOSAVE=1`, Hermes writes each completed task back into the
vault, closing the memory loop. A 3-level **memory router** (Context · Project ·
Long-term) merges and weights recall across tiers. Set `MEMORY_VAULT` (or
`OBSIDIAN_VAULT`) and Hermes recalls relevant notes to ground each task. See
[`memory/README.md`](memory/README.md).

## Deployment

The backend serves the API **and** the static frontend, so the app ships as one
container. `docker compose up --build` brings up PostgreSQL + the app at
`http://localhost:3000`. See [`DEPLOY.md`](DEPLOY.md) for the full-stack and
split (Vercel frontend + hosted API) options.

## Status

| Phase | Component        | Verified                                               |
| ----- | ---------------- | ------------------------------------------------------ |
| 1     | Foundation       | files in place                                         |
| 2     | MCP + Skill      | MCP smoke test passes (incl. sandbox)                  |
| 3     | Agent            | 7/7 tests pass; Hermes self-corrects + recalls         |
| 4     | BLAST app        | 6/6 backend tests pass (in-memory + Postgres + Stripe) |
| 5     | Memory (Obsidian)| 25/25 tests pass; bm25/vector/hybrid + Pinecone + router + ingest |
| 6     | Deploy           | Dockerfile builds; compose + Vercel configs            |

CI runs all suites (and a Docker image build) on every push and pull request; a
pre-commit hook runs the tests locally before each commit (`npm run setup:hooks`).
