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
└── src/                 # Phase 4 — BLAST application
    ├── backend/              Express API: JWT auth + Stripe-stub payments
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

## Status

| Phase | Component        | Verified                              |
| ----- | ---------------- | ------------------------------------- |
| 1     | Foundation       | files in place                        |
| 2     | MCP + Skill      | MCP smoke test passes (incl. sandbox) |
| 3     | Agent            | 5/5 tests pass; Hermes self-corrects  |
| 4     | BLAST app        | 11/11 backend tests pass; serves live |
