Run a full repo state audit and report results clearly. Do not modify files, commit, or push.

Run these commands:
1. `git status -sb`
2. `git log --oneline -8`
3. `git diff --stat`
4. `git diff --cached --stat`
5. `git log --oneline origin/main..main`
6. `git log --oneline main..origin/main`
7. `git branch -vv`

Report:
- Is the working tree clean?
- Are there uncommitted staged or unstaged changes?
- Are there untracked files that may need to be committed or gitignored?
- Is local main ahead of, behind, or in sync with origin/main?
- Is it safe to begin risky work (merge, rebase, deploy, delete)?

End with a single clear verdict: CLEAN / NEEDS ATTENTION / UNSAFE TO PROCEED.
