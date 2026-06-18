# Umhlawati Memory (Obsidian-backed)

Long-term memory for the agent, backed by an **Obsidian vault** — a directory of
Markdown notes. Notes are parsed (frontmatter, `#tags`, `[[wikilinks]]`) and
ranked with **BM25**, so recall works fully offline with no embeddings or
external services.

## The 3 levels of memory

| Level       | Where it lives                  | This module                     |
| ----------- | ------------------------------- | ------------------------------- |
| Context     | the current prompt              | handled by the agent            |
| Project     | `CLAUDE.md`, repo files         | handled by the MCP server       |
| Long-term   | your Obsidian vault             | **this module**                 |

## Backends: BM25, vector, or hybrid

Set `MEMORY_BACKEND` (or pass `backend`) to choose how notes are ranked:

| Backend  | How it ranks                          | Needs                        |
| -------- | ------------------------------------- | ---------------------------- |
| `bm25`   | keyword relevance (default)           | nothing — fully offline      |
| `vector` | semantic similarity via embeddings    | an embedder (mock/openai/ollama) |
| `hybrid` | 50/50 blend of BM25 + vector          | an embedder                  |

```bash
MEMORY_BACKEND=hybrid node memory/cli.js /path/to/vault "secure login tokens"
```

Embeddings are pluggable via `EMBEDDING_PROVIDER` (`mock` is deterministic and
offline; `openai` and `ollama` give real semantic vectors). The vector store is
an in-memory cosine index whose `upsert/query` API mirrors a hosted vector DB
(Pinecone), so it can be swapped later without changing callers.

## Three levels of memory (router)

`createMemoryRouter()` merges results across tiers, weighting recent context
above long-term recall:

```js
import { createObsidianMemory } from "./memory/memory-store.js";
import { createMemoryRouter } from "./memory/memory-router.js";

const longterm = await createObsidianMemory({ vaultPath: "/path/to/vault" });
const router = createMemoryRouter({ longterm });           // + optional `project`

router.remember("Decision: refunds within 24h.", { tags: ["payments"] });
const hits = await router.recall("refund policy");          // [{ ..., level }]
```

| Level       | Source                          | Weight |
| ----------- | ------------------------------- | ------ |
| Context     | session items via `remember()`  | 1.0    |
| Project     | a `project` memory (optional)   | 0.8    |
| Long-term   | your Obsidian vault             | 0.6    |

## Use it directly

```bash
# Query your own vault
node memory/cli.js /path/to/ObsidianVault "stripe webhook handling" 3

# Or set OBSIDIAN_VAULT and omit the path
OBSIDIAN_VAULT=/path/to/ObsidianVault node memory/cli.js "jwt auth" 3
```

## Use it from code

```js
import { createObsidianMemory } from "./memory/memory-store.js";

const memory = await createObsidianMemory({ vaultPath: "/path/to/vault" });
const hits = memory.search("how do refunds work", { limit: 5 });
//   -> [{ id, title, score, snippet, tags }]
const note = memory.get(hits[0].id);   // full note
await memory.reindex();                 // re-read the vault after edits
```

## Connecting your vault to Hermes

Hermes recalls relevant notes automatically when `MEMORY_VAULT` is set:

```bash
MEMORY_VAULT=/path/to/ObsidianVault node agent/hermes.js "Add a refund endpoint"
# [hermes] recalled 1 note(s): Stripe Integration
```

The recalled notes are injected as grounding context into the generate/revise
steps of the critic loop. A relevance guard drops weak matches so only genuinely
relevant notes are sent.

## How parsing works

- **Frontmatter** (`---` block): `title`, `tags` (inline `[a, b]` or block list).
- **Tags**: frontmatter tags plus inline `#tags` in the body.
- **Links**: `[[Note]]` and `[[Note|alias]]` (alias and `#heading` stripped).
- Skips `.obsidian/`, `.trash/`, `.git/`, and `node_modules/`.

## Scaling further

The bundled vector store is an in-memory cosine index — fine for a personal
vault (thousands of notes). For very large corpora or shared/hosted recall,
swap it for a managed vector DB (e.g. Pinecone) behind the same
`upsert()/query()` API; the memory and router layers won't change.
