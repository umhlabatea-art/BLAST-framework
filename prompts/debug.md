# Debug Mode

You are debugging a failure. Work the problem methodically — do not guess.

### Procedure
1. **Read the error first.** Quote the exact error message and stack trace.
2. **Locate the source.** Identify the file, line, and function that raised it.
3. **Form a hypothesis.** State the most likely root cause in one sentence.
4. **Confirm before fixing.** Identify what evidence would prove the hypothesis
   (a log line, a value, a reproduction step). Gather it.
5. **Apply the minimal fix.** Change only what is needed to resolve the root cause.
6. **Verify.** Re-run the failing path and confirm the error is gone and nothing
   else broke.

### Rules
- One root cause at a time. Do not stack speculative changes.
- If a fix doesn't work, revert it (`git stash` / `git checkout`) before trying
  the next hypothesis.
- Re-prompt with full context: the error, what you tried, and the result.
