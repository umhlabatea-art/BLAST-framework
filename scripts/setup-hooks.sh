#!/usr/bin/env bash
# Point git at the repo's tracked hooks directory. Run once per clone.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath .githooks
chmod +x .githooks/* 2>/dev/null || true
echo "Git hooks enabled (core.hooksPath = .githooks)."
echo "The pre-commit hook will now run the test suites before each commit."
