---
name: context-digest
description: >
  Generate a compact Markdown digest of a project (tree + key file summaries)
  that can be pasted into an LLM as grounding context. Keeps token cost low by
  skipping dependencies, build output, and binary files.
trigger: "When you need to brief an AI on an unfamiliar repo quickly."
---

# Skill: Context Digest

## What it does

Walks a project directory and produces a single Markdown document containing:

1. A file tree (ignored directories excluded).
2. For each text file, its path, line count, and first lines (configurable).

## How to run

```bash
node skills/context-digest/digest.js [projectRoot] [headLines]
```

- `projectRoot` — directory to scan. Defaults to the current directory.
- `headLines` — number of leading lines to include per file. Defaults to `20`.

Output is written to stdout, so redirect it:

```bash
node skills/context-digest/digest.js . 15 > project-digest.md
```

## When to use it

- Onboarding the agent to a repo it hasn't seen.
- Producing a lightweight snapshot for a NotebookLM / Pinecone memory entry.

## When NOT to use it

- For very large monorepos — scope it to a sub-path instead.
