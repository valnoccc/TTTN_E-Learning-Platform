# AGENTS.md

## Project Stack
- Frontend: React + Vite + TailwindCSS + TypeScript
- State/API: Redux Toolkit + RTK Query
- Backend: NestJS + Prisma + MySQL (TiDB)
- AI tools: Superpowers + CodeGraph

## Required Reading Before Coding
1. `docs/project-overview.md`
2. `docs/requirements.md`
3. `docs/architecture.md`
4. `docs/ai-agent-workflow.md`
5. `docs/codegraph-guide.md`
6. `docs/frontend-state-management.md` if frontend state/API changes
7. `docs/api-contract.md` if backend or API client changes

## Agent Rules
- Use Superpowers for non-trivial feature work.
- Use CodeGraph before reading many files.
- Prefer existing architecture and naming conventions.
- Do not modify unrelated files.
- Update tests when behavior changes.
- Update API/state docs when contracts change.

## Verification
Before finishing, run relevant checks:
- Frontend: lint, typecheck, test, build
- Backend: lint, test, test:e2e
- UI flow changes: Playwright tests