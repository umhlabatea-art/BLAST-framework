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
├── memory/              # Phase 5 — Obsidian-vault long-term memory (BM25/vector/hybrid)
├── routines/            # Phase 7 — cron-scheduled Hermes jobs (24/7 agents)
├── crm/                 # Phase 8 — enrichment, Instantly export, follow-up digest
├── chat/                # Phase 8 — chat front-end (router + Discord adapter)
├── src/                 # Phase 4 — BLAST application
│   ├── backend/              Express API: JWT auth + Stripe + leads/CRM
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

## Routines (scheduled agents)

Run Hermes tasks on cron schedules — outcomes are logged back to the vault.

```bash
node routines/cli.js list                 # show configured routines + next run
node routines/cli.js run-due              # run anything due now (wire to system cron)
node routines/cli.js start                # in-process scheduler (once a minute)
```

Define routines in `routines/routines.json` (`name`, `schedule` cron, `task`).
The cron engine supports `*`, lists, ranges, and steps. With `MEMORY_VAULT` set,
each run writes an Obsidian note under `routines/`.

## CRM (leads)

The BLAST API includes a lead pipeline scoped to the authenticated user:

| Method | Route | Purpose |
| ------ | ----- | ------- |
| POST   | `/api/leads`            | create a lead |
| POST   | `/api/leads/bulk`       | seed/import many (per-row errors reported) |
| GET    | `/api/leads?status=`    | list (optional status filter) |
| GET    | `/api/leads/:id`        | fetch one (owner-only) |
| PATCH  | `/api/leads/:id`        | update fields / validated status transition |
| POST   | `/api/leads/:id/notes`  | append a note |
| GET    | `/api/leads/:id/followups` | computed follow-up cadence |

Status lifecycle: `new → contacted → qualified → won/lost` (transitions are
validated; `won`/`lost` are terminal). Follow-ups are computed from a cadence
(days after creation), so the UI/agent can surface the next action.

### Enrichment & outbound (Instantly)

- `POST /api/leads/:id/enrich` — derive domain, business-vs-free, a 0-100 score,
  and tags; fills in `company` when discovered.
- `POST /api/leads/export/instantly` — enrich + push leads to an Instantly
  campaign (stub unless `INSTANTLY_API_KEY` is set).
- CLI: `node crm/enrich-export-cli.js <campaignId>`.

### CRM → routines bridge (morning digest)

`node crm/digest-cli.js` scans all leads, finds overdue follow-ups, and writes a
**"Next Actions"** note to the vault under `crm/`. Schedule it via system cron:

```cron
0 8 * * 1-5  cd /repo && MEMORY_VAULT=~/vault node crm/digest-cli.js
```

## Chat front-end

Drive Hermes and the CRM from chat. The command router is transport-agnostic; a
**Discord** adapter ships in `chat/` (Slack reuses the same router).

```bash
DISCORD_BOT_TOKEN=... node chat/cli.js
```

Commands: `!hermes <task>` (replies in a thread, result saved to the vault),
`!leads [status]`, `!lead add <name> | <email> | <company>`,
`!lead status <id> <status>`, `!followups`, `!help`. Leads created in chat share
the same store as the API.

## Status

| Phase | Component        | Verified                                               |
| ----- | ---------------- | ------------------------------------------------------ |
| 1     | Foundation       | files in place                                         |
| 2     | MCP + Skill      | MCP smoke test passes (incl. sandbox)                  |
| 3     | Agent            | 7/7 tests pass; Hermes self-corrects + recalls         |
| 4     | BLAST app + CRM  | 12/12 backend tests (in-memory + Postgres + Stripe + leads + export) |
| 5     | Memory (Obsidian)| 25/25 tests; bm25/vector/hybrid + Pinecone + router + ingest |
| 6     | Deploy           | Dockerfile builds; compose + Vercel configs            |
| 7     | Routines         | 10/10 tests; cron engine + scheduler + vault logging   |
| 8     | CRM tooling + Chat | 9/9 CRM + 8/8 chat tests; enrichment, Instantly, digest, Discord |

CI runs all suites (and a Docker image build) on every push and pull request; a
pre-commit hook runs the tests locally before each commit (`npm run setup:hooks`).
