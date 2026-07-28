# Umhlabatea

A community-centric, SEO/AEO-optimised **AI music platform** for South African
artists, with embedded AI agents for music generation, rights registration
(SAMRO · CAPASSO · RISA), and revenue pipelines. Built on the Umhlawati
AI-development ecosystem (prompt workflows, skills, a custom MCP server, and a
self-correcting agent).

Everything runs **offline-first**: on a fresh clone, with no API keys, database,
or network, the whole platform is usable and tested — real services swap in via
environment variables alone.

## Monorepo layout

```
umhlabatea/
├── CLAUDE.md            # AI operating directives for this repo
├── .env.example         # configuration template
├── package.json         # npm workspaces + orchestration scripts
├── prompts/             # reusable prompt workflows (plan · build · critic · debug)
├── skills/              # executable automation recipes
├── mcp-server/          # sandboxed MCP server (stdio)
├── agent/               # Hermes orchestrator + LLM critic loop
├── packages/
│   └── core/            # shared types, mock data, brand theme, and the
│                        #   deterministic offline AI-agent stubs
│                        #   (music-gen · SEO/AEO · compliance · revenue)
└── apps/
    ├── api/             # modular Express API (BLAST): auth, tracks, generate,
    │                    #   community, subscriptions, revenue, compliance, agents
    └── mobile/          # Expo / React Native + NativeWind (Tailwind) app
```

## Quick start

```bash
npm install                      # links the workspace (packages/core → apps/api)

# Run every backend test suite (core + API)
npm test                         # 11 core + 21 API tests

# API only
npm run dev:api                  # http://localhost:5000

# Mobile app (offline mock by default)
cd apps/mobile && npm install && npm run start
```

## The BLAST app

**B**ackend · **L**ogic · **A**uth · **S**torage · **T**ransactions — the API in
`apps/api`. It runs on in-memory + stub services out of the box and delegates all
domain logic to `@umhlabatea/core`, so the app and API never diverge. To go live,
set environment variables (see `.env.example`):

- `AUTH_SECRET` — long random string for signing tokens.
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` and `npm i stripe` — switches
  payments from stub to live with no code changes.
- `EXPO_PUBLIC_API_URL` — points the mobile app at the live API.

## AI agents (offline stubs, live-swappable)

All agents live in `packages/core/agents` as pure, deterministic functions:

| Agent        | What it does                                                        |
| ------------ | ------------------------------------------------------------------- |
| `musicGen`   | Prompt → fully-formed Track (deterministic; real Suno/Replicate later) |
| `seoAeo`     | Track → meta, keywords, voice-search phrases, schema.org JSON-LD     |
| `compliance` | SAMRO/CAPASSO/RISA submission prep + a registration state machine    |
| `revenue`    | 80/20 split, payout scheduling, affiliate income                    |

A real LLM (see `agent/provider.js`, Anthropic/OpenRouter/Ollama) drops in behind
the same function signatures without touching any caller.

> **Rights bodies note:** SAMRO, CAPASSO and RISA expose no public API, so the
> compliance agent *prepares and tracks* submissions (fields, CSV rows, ISRCs) —
> it does not call a live endpoint.

## Status

| Component          | Verified                                            |
| ------------------ | --------------------------------------------------- |
| `packages/core`    | 11/11 unit tests pass                               |
| `apps/api`         | 21/21 API tests pass                                |
| `apps/mobile`      | `tsc --noEmit` clean; static web export builds (17 routes) |
| MCP + Skill        | MCP smoke test passes (incl. sandbox)               |
| Agent              | 5/5 tests pass; Hermes self-corrects                |
