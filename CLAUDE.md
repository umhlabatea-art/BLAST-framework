# Umhlawati Project Directives

> The "brain" for any AI agent operating in this repository. Read this first,
> every session, before touching code.

## Project Overview

Umhlawati is an AI-powered development ecosystem. It bundles:

- A **prompt library** of reusable planning and build workflows.
- **Skills** — self-contained, executable automation recipes.
- A **custom MCP server** that exposes local project context to any MCP client.
- An **agent layer** (Hermes orchestrator + autonomous critic loop).
- The **BLAST** application framework for shipping real products.

## Folder Structure

| Path            | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| `/prompts/`     | Reusable prompt chains (Plan Mode, Website Build, Critic, Debug).   |
| `/skills/`      | Executable `SKILL.md` recipes + their helper scripts.              |
| `/mcp-server/`  | Custom Model Context Protocol server (stdio transport).            |
| `/agent/`       | Hermes orchestrator and the LLM-as-judge critic loop.             |
| `/src/`         | BLAST application code (`frontend/` + `backend/`).                |

## Coding Standards

- Write clean, modular, self-documenting code following SOLID principles.
- Comments explain **why** a non-obvious decision was made, not **what** the code does.
- Validate all inputs at system boundaries (CLI args, env vars, network, queues).
- Prefer non-blocking I/O. Handle failures explicitly — no silent catches.
- Strict typing everywhere it is available (TypeScript strict mode, Python type hints).
- No hardcoded secrets. Everything sensitive loads from environment variables.

## Git Workflow

- Commit small, logical, atomic chunks of work.
- Use Conventional Commits: `type(scope): lower-case description`.
  - Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- Never push directly to `main` — branch, then open a PR.

## Secrets & Configuration

- Copy `.env.example` to `.env` and fill in real values locally.
- `.env` is git-ignored and must never be committed.

## How To Use The Prompt Library

Point the agent at a prompt file to load a workflow, e.g.:

> "Read `/prompts/plan-mode.md` and use it to architect a user-auth flow."
