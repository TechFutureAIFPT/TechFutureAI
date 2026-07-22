# 08 - Cai dat, trien khai va kiem thu

> Quy trình release Supabase, rehearsal, cutover, PITR và rollback nằm tại `13-supabase-migration-runbook.md`. Không bật provider Supabase nếu chưa có Web FE, Auth import, SQL/RLS và reconciliation thành công.

## Chay backend local

Thu muc:

```text
Software/Web/BE/api_server
```

Lenh:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend local:

```text
http://localhost:8000
```

Health check:

```text
GET http://localhost:8000/health
GET http://localhost:8000/health/live
GET http://localhost:8000/health/ready
```

## Chay Docker Compose

Tu `Software/Web/BE`:

```bash
docker compose up --build
docker compose up --scale worker=3
```

Compose chay ba thanh phan: API, Redis va analysis worker. Redis health phai pass truoc khi API/worker khoi dong.
Khong chia se output `docker compose config` vi file `.env` co the bi render ra man hinh.

## Deploy Kubernetes

Manifest nam tai `Software/Web/BE/deploy/kubernetes` va dung Kustomize.

Kiem tra offline:

```bash
kubectl kustomize deploy/kubernetes/overlays/local
kubectl kustomize deploy/kubernetes/overlays/production
```

Local cluster:

```bash
docker build -t supporthr-backend:local ./api_server
kubectl apply -k deploy/kubernetes/overlays/local
```

Production can image tag bat bien, `supporthr-backend-secrets`, managed Redis, Metrics Server, ingress va TLS.
Chi tiet va lenh rollout nam trong `deploy/kubernetes/README.md`.

## Bien moi truong backend toi thieu

Can co Firebase va Gemini:

```text
FIREBASE_SERVICE_ACCOUNT_JSON
```

Hoac bo:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Can Gemini:

```text
GEMINI_API_KEY_1
```

Neu dung Google Drive:

```text
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
GOOGLE_DRIVE_ALLOWED_ORIGINS
```

## Chay frontend local

Thu muc:

```text
Software/Web/FE
```

Lenh:

```bash
npm install
npm run dev
```

Frontend local thuong la:

```text
http://localhost:5173
```

Neu can tro FE vao backend rieng:

```text
VITE_API_URL=http://localhost:8000
```

## Build frontend

```bash
npm run build
```

Script trong `package.json`:

```json
{
  "build": "tsc && vite build"
}
```

Nghia la build se check TypeScript truoc, roi Vite build sau.

## Deploy backend Render

File:

```text
Software/Web/BE/render.yaml
```

Cau hinh:

- Service type: `web`.
- Runtime: Python.
- Root dir: `api_server`.
- Build: `pip install -r requirements.txt`.
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Python version: `3.11.11`.

Can set secret env vars tren Render dashboard:

- Gemini keys.
- Firebase Admin credentials.
- Google OAuth credentials.
- Google API keys.

AI runtime vars phai dong bo:

```text
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_EMBEDDING_DIMENSION=768
VECTOR_INDEX_VERSION=gemini-embedding-2-768-v1
RUBRIC_VERSION=v2
VECTOR_STORE_PROVIDER=firestore
AI_PREPROCESS_CONCURRENCY=4
REQUIRE_CLASSIFIER_READY=true
```

Render build chi lay `api_server`; `BE/ml_pipeline/data`, artifacts va source train khong vao image. Startup
kiem model manifest. Sau deploy, `/health` phai tra `classifier.ready=true`, model version va 24 labels.

## Deploy frontend Vercel

File:

```text
Software/Web/FE/vercel.json
```

Rewrite:

- `/privacy-policy` -> `/privacy-policy.html`
- `/terms` -> `/terms.html`
- Tat ca route khac khong phai `/api/` -> `/index.html`

Y nghia:

- React Router co the refresh truc tiep o `/analysis`, `/dashboard`, ...
- Vercel khong bi 404 khi SPA route.

## Train ML pipeline

Thu muc:

```text
Software/Web/BE/ml_pipeline
```

Cai thu vien:

```bash
pip install -r ml_pipeline/requirements.txt
```

Audit truoc khi train:

```bash
python ml_pipeline/train_classifier.py --dataset-csv D:/datasets/Resume.csv --audit-only
```

Train release sau khi xac minh quyen su dung dataset:

```bash
python ml_pipeline/train_classifier.py \
  --dataset-csv D:/datasets/Resume.csv \
  --dataset-license "<reviewed-license-id>"
```

Output:

```text
api_server/app/models/text_classifier_model.pkl
api_server/app/models/text_classifier_model.manifest.json
ml_pipeline/artifacts/dataset_audit.json
ml_pipeline/artifacts/evaluation.json
```

Khong train khi server startup. Khong commit `ml_pipeline/data` hoac artifacts tam. Script release chi thay model
khi macro-F1 qua gate va tao manifest checksum moi.

## Seed RAG va tao vector index

Dry-run truoc, mac dinh status `pending`:

```bash
python ml_pipeline/seed_exemplars.py --data-csv D:/datasets/job_resume_fit.csv --dry-run --limit 5
```

Sau recruiter review moi dung `--status approved --allow-approved`. Tat ca exemplar cu cua
`gemini-embedding-001` phai re-embed; backend se bo qua record khac version/dimension.

Tao Firestore composite vector index cho collection `approvedExemplars`:

```bash
gcloud firestore indexes composite create \
  --collection-group=approvedExemplars \
  --query-scope=COLLECTION \
  --field-config=field-path=status,order=ASCENDING \
  --field-config=field-path=approved,order=ASCENDING \
  --field-config=field-path=rubricVersion,order=ASCENDING \
  --field-config=field-path=vectorIndexVersion,order=ASCENDING \
  --field-config=field-path=embedding,vector-config='{"dimension":"768","flat":"{}"}'
```

Neu index dang build, backend chi scan toi `RAG_CANDIDATE_LIMIT=100` record va van ap dung strict contract.

## Chay train tren Colab

Clone backend repo de ma train va runtime contract luon cung version:

```python
!git clone https://github.com/ten-tai-khoan/ten-repo.git
%cd /content/ten-repo
!pip install -r ml_pipeline/requirements.txt
!python ml_pipeline/train_classifier.py --dataset-csv /content/Resume.csv --audit-only
```

Sau audit, train voi `--dataset-license`; tai ve ca `.pkl` va `.manifest.json`, khong chi file `.pkl`.

## Kiem thu backend

Thu muc:

```text
Software/Web/BE/api_server
```

Tests hien co:

- `test_analysis_quality.py`
- `test_feedback_api.py`
- `test_local_classifier_service.py`
- `test_vector_index_service.py`
- `test_vector_store_service.py`
- `test_ai_contract_v2.py`

Lenh thuong dung:

```bash
python -m pytest
```

Neu chua cai pytest:

```bash
pip install pytest
python -m pytest
```

## Cac diem test dang bao ve

Tests trong repo dang tap trung vao:

- Advanced score breakdown.
- Candidate name extraction.
- Enrichment voi classifier/embedding.
- Rule-based fallback khi AI loi.
- Vector index/vector store.
- Local classifier service.
- Model manifest/checksum va 8 rubric tong 100.
- Cache invalidation theo CV/scoring/model version.
- Exemplar pending-by-default va vector contract.
- Feedback API.

## Checklist demo

Truoc khi thuyet trinh:

- Backend `/health` tra `ok`.
- Frontend chay duoc.
- Dang nhap Firebase duoc.
- Upload mot JD va mot CV mau duoc.
- `/api/files/extract-text` tra text.
- Analysis job ve `completed`.
- Dashboard hien candidates.
- Feedback/gui chatbot khong loi.
- Neu demo Google Drive, OAuth redirect URI khop domain dang dung.

## Loi thuong gap

### Backend 401 Firebase

Nguyen nhan:

- Thieu service account.
- Token frontend het han.
- Domain/cau hinh Firebase sai.

Huong xu ly:

- Kiem tra env Firebase backend.
- Dang xuat/dang nhap lai.
- Kiem tra `Authorization` header.

### Gemini loi API key

Nguyen nhan:

- Thieu `GEMINI_API_KEY_1`.
- Key het quota.
- Model config sai.

Huong xu ly:

- Them key thu 2 vao `GEMINI_API_KEY_2`.
- Kiem tra model trong `.env`.

### CORS loi

Nguyen nhan:

- Domain frontend khong nam trong allowed origins.

Huong xu ly:

- Set `FRONTEND_ORIGIN`.
- Set `GOOGLE_DRIVE_ALLOWED_ORIGINS`.

### Google Drive OAuth loi

Nguyen nhan:

- Redirect URI khong khop Google Cloud Console.
- Thieu client id/secret.
- Origin khong duoc allow.

Huong xu ly:

- Kiem tra `GOOGLE_OAUTH_REDIRECT_URI`.
- Kiem tra domain trong Google OAuth app.
