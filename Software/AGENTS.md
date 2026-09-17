# SupportHR Shared Agent Rules

These rules are the shared project baseline for Codex and Claude Code.

## Scope and priority

- Treat this as a mixed workspace, not a single application.
- The visible workspace areas are `FE`, `Resources`, and `backend`. The authoritative FE is `FE/Desktop`; its feature contract is `..\Document\FE`. `FE/Mobile` is the Expo/React Native companion app.
- `backend/` holds independently deployed servers / microservices:
  - `backend/cv-match-api` — the main CV↔JD scoring API (formerly `Web/BE`).
  - `backend/ai-assistant` — standalone server powering the FE's `/chatbot` page (own deploy, own Gemini key).
  - `backend/classifier-service` — standalone microservice for CV classification ML model (Colab, Kaggle, Local/Tunnel).
- Follow `FE/Desktop/AGENTS.md` for Web FE work and `FE/Mobile/AGENTS.md` for mobile work. The nearest rules take precedence over this shared baseline.
- Follow instruction priority in this order: platform instructions, the user's request, the nearest app or repository rules, this baseline, then optional skills.
- A skill may guide how to do the requested work, but it must not expand the requested scope or override verified project behavior.

## Working rules

- Inspect the actual target app, its package/config files, and its Git boundary before editing, staging, deleting, publishing, or deploying.
- Before changing `FE/Desktop`, read its nearest `AGENTS.md` plus the matching specification under `..\Document\FE`. Verify its Git boundary explicitly before staging or publishing.
- Preserve unrelated user changes in this mixed and frequently dirty workspace.
- Prefer low-churn changes that fit the current architecture. Do not invent an `apps/*` or `packages/*` monorepo layout unless the user explicitly requests and approves a migration.
- Explain the root cause for bug fixes and run checks proportional to the risk.
- Keep root-required entrypoints such as `AGENTS.md`, `CLAUDE.md`, and `.gitignore` at the workspace root.
- Use available inspection tools. No task is blocked merely because a particular optional tool such as codegraph is unavailable.

## Skill routing

- Activate only the smallest set of skills that directly matches the task.
- For UI work, use one primary layer: `frontend-design` for visual direction, `ui-ux-pro-max` for design-system intelligence, `frontend-ui-engineering` for implementation and accessibility, `vercel-react-best-practices` for React performance, or `web-design-guidelines` for an audit.
- Combine those UI skills only when the request genuinely spans their separate roles; do not load all of them by default.
- Use `book-guided-engineering` only for an explicit book-guided pass or a clearly matching architecture, refactoring, legacy, reliability, data, or DDD task. It must select one primary book reference at a time.
- Deployment skills never authorize deployment by themselves; an explicit user request is still required.

Provider-specific files may describe tool mechanics, but must not change these shared project rules.

## Documentation synchronization

- The outer workspace hub is `..\START-HERE.md`; the technical documentation index is `..\Document\01-Tai-Lieu-Du-An\README.md`.
- Before changing product workflows, architecture, APIs, data/auth models, AI pipelines, deployment, or major routes, consult `..\Document\01-Tai-Lieu-Du-An\11-MA-TRAN-TRUY-VET.md`.
- When those changes make a document inaccurate, update the matching document in the same task.
- Reports under `..\Document\02-Bao-Cao-Du-Thi` are submitted snapshots and must not be silently rewritten to follow code.
- Sample CV/JD files under `..\Document\03-Du-Lieu-Mau` are local test fixtures; access only what the task needs and do not publish personal data.
