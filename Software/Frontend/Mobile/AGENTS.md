# SupportHR Android Rules

These rules apply to the Expo/React Native app under `Software/Android`.

## Scope and structure

- Treat this folder as the mobile app boundary. Inspect `package.json`, `app.json`, `eas.json`, environment files, and the physical `Android` native directory before changing build or release behavior.
- Do not invent an `apps/*` or `packages/*` monorepo layout. Preserve the current Expo and generated native structure unless the user explicitly approves migration.
- Verify the active Git root before staging, committing, pushing, building, or submitting.

## Auth, data, and API

- Use Firebase client SDK for Authentication and permitted owner-scoped Firestore reads; never place Firebase Admin/service-account credentials in app code, environment bundles, logs, or releases.
- Use the configured Backend HTTP API for AI and account workflows. Validate request/response behavior against the Backend OpenAPI contract.
- Do not add Supabase runtime dependencies or configuration.
- Keep cached/offline data user-scoped, versioned, and safe across logout/account changes.

## Validation and release

- For normal changes, run `cmd /c npm run typecheck` from this folder on Windows.
- Before release, run `cmd /c npm run release:check` and verify package ID, versionCode, signing inputs, environment, Firebase files, and generated native configuration.
- Do not publish service-account files, local environment values, build caches, or generated artifacts that are ignored by Git.
- Build/submission/deployment requires an explicit user request; report any Play Console gating rather than bypassing it.

## Documentation

- Project map: `..\..\Document\01-Tai-Lieu-Du-An\00-BAN-DO-DU-AN.md`.
- Traceability matrix: `..\..\Document\01-Tai-Lieu-Du-An\11-MA-TRAN-TRUY-VET.md`.
- Update mapped technical documentation when mobile workflow, API usage, auth, data, build, or release behavior changes.
