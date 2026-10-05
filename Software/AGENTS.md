# SupportHR Shared Agent Rules

These rules are the shared project baseline for Codex, Claude Code, and Antigravity.

## Scope and Priority

- Workspace is strictly partitioned into two primary hubs:
  - `Frontend/`:
    - `Frontend/Desktop` — Web Recruiter Desktop SPA (Next.js 16 + React 19).
    - `Frontend/Mobile` — Expo / React Native companion app.
  - `Backend/`:
    - `Backend/Main` — The core CV↔JD scoring and orchestration API server (FastAPI, Redis Streams, Cloud Firestore).
    - `Backend/Extensions/ai-assistant` — Standalone microservice powering deep research & chat advisor (Port 8080).
    - `Backend/Extensions/classifier-service` — Standalone microservice for CV classification ML model (Port 5000).
    - `Backend/Extensions/careercompass-api` — Standalone microservice for career orientation assessment.

## Working Rules

1. Inspect target app package/config files and its Git boundary before editing, staging, deleting, or deploying.
2. Preserve unrelated user changes in this mixed workspace.
3. Follow `Frontend/Desktop` standards for web and `Frontend/Mobile` for mobile.
4. Keep all backend core logic in `Backend/Main` and respect microservice isolation in `Backend/Extensions`.
5. Keep root entrypoints `AGENTS.md`, `CLAUDE.md`, `.cursorrules` in sync at the workspace root.
