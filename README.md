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
├── products/            # Prompt-toolkit product library (the sellable content)
│   ├── recruiter-hiring-copy-system/
│   ├── financial-advisor-content-kit/
│   └── consultant-deliverable-toolkit/
└── src/                 # Phase 4 — BLAST application
    ├── backend/              Express API: JWT auth + Stripe-stub payments + catalog
    └── frontend/             minimal vanilla-JS client
```

## Quick start

Each module is self-contained. From the repo root:

```bash
# MCP server
cd mcp-server && npm install && npm run smoke

# Agent (offline, deterministic mock provider)
cd ../agent && npm test && node hermes.js "Write an email validator"

# BLAST app
cd ../src/backend && npm install && npm test
PORT=3000 npm start          # then open http://localhost:3000
```

## BLAST

The application framework: **B**ackend · **L**ogic · **A**uth · **S**torage ·
**T**ransactions. It runs entirely on in-memory + stub services out of the box.
To go live, set environment variables (see `.env.example`):

- `AUTH_SECRET` — long random string for signing tokens.
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` and `npm i stripe` — switches
  payments from stub to live with no code changes.
- `DATABASE_URL` — swap the in-memory store for Postgres/Supabase.

### Storefront + product catalog

The BLAST app is wired as a multi-product store for the prompt toolkits in
[`products/`](./products). `src/backend/catalog.js` is the single source of
truth for what's for sale and — critically — what it costs: `POST /api/checkout`
takes `{ productId, tier }` and resolves the price **server-side**, so the client
can never name its own price. Browse the catalog at `GET /api/products`; the
vanilla-JS frontend renders it as a product grid with a buy button per tier.

The `products/` directory is the sellable content (prompt packs + workflow docs +
Notion trackers + compliance disclaimers) — see [`products/README.md`](./products/README.md)
for the pricing architecture, platform strategy, and go-live playbook.

## Status

| Phase | Component        | Verified                              |
| ----- | ---------------- | ------------------------------------- |
| 1     | Foundation       | files in place                        |
| 2     | MCP + Skill      | MCP smoke test passes (incl. sandbox) |
| 3     | Agent            | 5/5 tests pass; Hermes self-corrects  |
| 4     | BLAST app        | backend tests pass; serves live       |
| 4     | Storefront       | product catalog + tiered checkout      |
