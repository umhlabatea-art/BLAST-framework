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

## Upgrade path

BM25 is the offline default. To scale to a large vault or fuzzy semantic recall,
swap the index for a vector store (e.g. Pinecone) behind the same
`search()/get()` API — callers won't change.
