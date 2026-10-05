# SupportHR AI Assistant Service

Standalone FastAPI server for the general-purpose "Trợ lý AI" chat feature used by
the [`/ai-assistant`](../Web/FE/assets/js/pages/ai-assistant.js) page in the CV Match
web app. Runs independently from the main [`Software/backend/cv-match-api`](../cv-match-api) API — its
own deploy, own Gemini key, same Firebase project (shared user accounts + Firestore).

Not a job-market data platform: it answers with general knowledge about hiring,
careers, CVs and JDs, and explicitly tells the user when it has no live market data
to cite (no salary/job-count numbers are ever invented).

## Endpoints

- `POST /api/assistant/sessions` — create a chat session (lazy: call this only when
  the user sends their first message)
- `POST /api/assistant/sessions/{id}/reply` — send a message, get a Gemini-generated reply
- `GET /api/assistant/sessions` — list the caller's saved sessions
- `GET /api/assistant/sessions/{id}` — fetch one session's full message history
- `DELETE /api/assistant/sessions/{id}` — delete a session
- `POST /api/assistant/deep-research` — real web-search-backed research report.
  Body `{"question": "..."}`. Plans 2-4 search queries with Gemini, runs them
  through Tavily, synthesizes a cited Markdown report from the actual retrieved
  content (never invents facts not present in a source). Used by the mobile
  app's "Nghiên cứu ngành nghề" tool. Requires `TAVILY_API_KEY`; without it the
  endpoint still responds (auth/validation all work) but returns a clear
  "no sources found" message instead of a report.
- `GET /health` — liveness + Firestore/Gemini config check

All `/api/assistant/*` routes require `Authorization: Bearer <Firebase ID token>` —
the exact same Firebase project as the main app, so a user who is logged into CV
Match is automatically authenticated here too.

## Environment variables

See [`.env.example`](.env.example). Required:

- `GEMINI_API_KEY` — a **dedicated** key for this service (Google AI Studio →
  API keys). Do not reuse a key that has ever been pasted in plaintext chat/logs
  without rotating it first.
- `GEMINI_MODEL` — defaults to `gemini-flash-latest`.
- Firebase Admin credentials — either `FIREBASE_SERVICE_ACCOUNT_JSON` (paste the
  full service-account JSON as one line) or the three separate
  `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` fields.
  Reuse the same values already configured for `Software/backend/cv-match-api` so both servers
  share one Firebase project and one Firestore database.
- `ALLOWED_ORIGINS` — comma-separated extra CORS origins for your production FE
  domain. `localhost`, `*.vercel.app`, `*.netlify.app`, `*.pages.dev`,
  `*.railway.app` and `*.onrender.com` are already allowed.
- `TAVILY_API_KEY` — optional, only needed for `/api/assistant/deep-research`.
  Get one at [tavily.com](https://tavily.com) (free tier available).

**Never commit real secret values.** `.env` is gitignored; set real values only in
your local `.env` file or directly in the Railway/Render dashboard.

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # then fill in real values
uvicorn app.main:app --reload --port 8080
```

## Deploy — Railway

```bash
railway login          # if not already logged in
railway init            # creates a new Railway project for this service
railway up               # builds the Dockerfile and deploys
railway variables --set "GEMINI_API_KEY=..." --set "GEMINI_MODEL=gemini-flash-latest"
railway variables --set "FIREBASE_SERVICE_ACCOUNT_JSON=..."
railway domain            # generates a public URL
```

## Deploy — Render

1. Push this repo to GitHub.
2. In the Render dashboard: **New → Blueprint**, point it at this repo — it will
   read [`render.yaml`](render.yaml) and create the service automatically.
3. Fill in `GEMINI_API_KEY` and `FIREBASE_SERVICE_ACCOUNT_JSON` in the service's
   **Environment** tab (they're marked `sync: false` so Render won't ask for them
   in the blueprint file itself).

## Wiring the FE to this service

In `Software/FE/Desktop/config.js` (or `config.local.js` for local dev), set:

```js
window.SUPPORT_HR_CONFIG = Object.freeze({
  // ...existing keys...
  ASSISTANT_API_BASE_URL: "https://<your-deployed-service-domain>",
});
```

The `/ai-assistant` page's API calls (`assets/js/api/endpoints.js`) already read
this value — no other FE code changes are needed once it's set.
