# AI Agent Workflow

## For Large Features
Use this flow:
1. Brainstorm requirements.
2. Write design/spec.
3. Write implementation plan.
4. Use CodeGraph to locate related modules.
5. Write or update tests first.
6. Implement in small steps.
7. Run verification.
8. Summarize changed files, tests, risks.

## For Bug Fixes
Use this flow:
1. Reproduce or identify failing behavior.
2. Use CodeGraph to find related symbols.
3. Inspect callers/callees and impact.
4. Add regression test if possible.
5. Fix the smallest responsible area.
6. Run targeted tests.

## For Refactoring
Use this flow:
1. Use CodeGraph impact analysis.
2. Identify affected modules.
3. Preserve public API unless explicitly changed.
4. Run full affected test suite.