# Umhlawati Agent Layer

Hermes (the orchestrator) plus the autonomous critic loop — your self-correcting
AI operator.

## Components

| File             | Role                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `provider.js`    | Pluggable LLM provider: openrouter, anthropic, ollama, mock.      |
| `critic-loop.js` | LLM-as-judge loop: generate → critique → revise until it passes.  |
| `hermes.js`      | CLI orchestrator that runs a task through the loop.               |
| `env.js`         | Zero-dependency `.env` loader.                                    |
| `test.js`        | Offline tests (use the deterministic mock provider).             |

## Run it

```bash
cd agent
npm test                                   # offline, no keys needed

# Dry run with the mock provider (default):
node hermes.js "Write a function that validates an email address"

# With a real provider:
LLM_PROVIDER=openrouter LLM_API_KEY=sk-... \
  node hermes.js "Write a rate limiter middleware for Express"
```

Configure the provider in the repo-root `.env` (see `.env.example`):
`LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`.

## How the critic loop works

1. **Generate** a first draft from the task.
2. **Critique** it against `prompts/critic-review.md` — the model returns a JSON
   verdict (`pass`/`revise`, score, issues).
3. If `revise`, **apply the fixes** and critique again.
4. Stop on `pass` or when the iteration budget (default 3) is reached.

The final artifact is written to stdout; progress logs go to stderr, so you can
safely redirect the result: `node hermes.js "..." > output.js`.
