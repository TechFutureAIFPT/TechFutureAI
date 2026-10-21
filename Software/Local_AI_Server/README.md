# AI Match Local Server

Local AI Match is the on-device API and Database Studio for AI Match. It runs FastAPI on port `8088`, uses Ollama for inference, and stores application data, users, login sessions, Drive tokens, and administrator sessions in SQLite. The cloud backend in `Software/Backend/Main` remains a separate Gemini/Firebase deployment.

## Runtime layout

- `app/api/routes/`: compatible CV, job, file, database, admin, and health APIs.
- `app/ai/` and `app/services/`: Ollama clients, general Qwen workflows, and dedicated evidence-grounded CV Match scoring.
- `app/db/`: SQLite schema, additive migrations, repositories, and vector storage.
- `app/templates/` and `app/static/`: the single Database Studio interface.
- `run_server.py`: the local API entry point.

The CV scoring service calls the configured `LOCAL_CV_MODEL` once per CV. The model returns criterion-level evidence; Python verifies quoted evidence against the source CV and computes weighted scores. It does not silently fall back to invented or rule-based scores when inference fails. General assistant tasks use `LOCAL_LLM_MODEL`; embeddings use `LOCAL_EMBEDDING_MODEL`.

Existing SQLite business table and column names are retained to preserve compatibility with local data. SQLite migrations are additive and create a backup before applying pending changes to an existing database. The local server contains no Firebase Admin SDK, Firestore client, Gemini SDK, or cloud sync operation.

## Setup

1. Install Ollama and pull the configured models, or change the model names in `.env`:

   ```powershell
   ollama pull qwen2.5-coder:7b
   ollama pull cv-match:7b
   ollama pull nomic-embed-text:latest
   ```

2. Create the environment and install dependencies:

   ```powershell
   Copy-Item .env.example .env
   .venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

   Generate a Fernet key with `.venv\Scripts\python.exe -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` and paste it into `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY` in `.env`. Add each frontend origin to `GOOGLE_DRIVE_ALLOWED_ORIGINS` and to the Google OAuth client's authorized JavaScript origins. The Drive flow requests read-only access, stores OAuth states and encrypted access/refresh tokens in SQLite, and can list or import supported files. Scanned documents requiring OCR are rejected until an OCR engine is configured.

3. Create a Google OAuth web client. Add `http://localhost:8088/api/admin/google/callback`, `http://localhost:8088/api/auth/google/callback`, and `http://localhost:3000/google-drive/callback` as authorized redirect URIs, and add `http://localhost:3000` as an authorized JavaScript origin. Set the client ID and secret in `.env`. Admin access is limited to the verified email in `ADMIN_EMAIL`; recruiter accounts and their revocable sessions are stored in SQLite.

4. Start Ollama, then run `start_server.bat` or:

   ```powershell
   .venv\Scripts\python.exe run_server.py
   ```

Open `http://localhost:8088/admin/login`. The signed-in administrator can open the Database Studio at `/dashboard`. API documentation is at `/docs`; `/health/live` checks process liveness and `/health/ready` checks SQLite and all configured Ollama models.

The Desktop frontend can use local authentication when `NEXT_PUBLIC_RUNTIME_MODE=local`; its API base defaults to `http://localhost:8088`. Local registration and email sign-in use SQLite credentials and revocable bearer sessions. Google sign-in uses the configured OIDC client and stores its identity mapping and session locally.

## Verification

Run tests from this directory so Python resolves the `app` package:

```powershell
$env:PYTHONPATH='.'
.venv\Scripts\python.exe -m pytest tests -q
.venv\Scripts\python.exe scripts\test_dashboard_routes.py
```

Model inference tests use mocked Ollama HTTP responses and do not require model weights. To test real inference, start Ollama with the configured models and call the local APIs.

## Data and credentials

`.env`, SQLite files, backups, model weights, and runtime data are local-only. Never commit OAuth secrets or database contents. Google OAuth is independent from the cloud backend; administrator sign-in and the Drive read-only connection are stored by this local service.
