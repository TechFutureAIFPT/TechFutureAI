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
kubectl kustomize deploy/kubernetes/overlays/oci-free
```

Local cluster:

```bash
docker build -t supporthr-backend:local ./api_server
kubectl apply -k deploy/kubernetes/overlays/local
```

Production multi-node can image tag bat bien, `supporthr-backend-secrets`, managed Redis, Metrics Server, ingress va TLS.
Overlay `oci-free` danh cho mot node K3s ARM64, co Redis AOF/PVC noi bo va bo HPA/PDB khong co gia tri tren mot node.
Chi tiet va lenh rollout nam trong `deploy/kubernetes/README.md`.

## Bien moi truong backend toi thieu

Can co Supabase:

```text
SUPABASE_URL
DATABASE_URL
DATA_ENCRYPTION_KEY
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

## Deploy backend khong phu thuoc Render

Duong production mac dinh cho VPS mien phi la Docker image chay bang K3s:

```text
Software/Web/BE/.github/workflows/container-image.yml
Software/Web/BE/.github/workflows/deploy-vps.yml
Software/Web/BE/deploy/kubernetes/overlays/oci-free
Software/Web/BE/deploy/vps/bootstrap-k3s-ubuntu.sh
Software/Web/BE/deploy/vps/deploy-k3s.sh
Software/Web/BE/deploy/vps/rollback-k3s.sh
```

Cau hinh gom:

- GitHub Actions build image `linux/amd64` va `linux/arm64`, publish GHCR voi tag `main`, `latest`, `sha-*` va semver.
- K3s dung containerd de chay dung image GHCR; khong chay Docker Compose song song tren node production.
- Mot pod API, mot worker, Redis StatefulSet/PVC, Traefik va cert-manager HTTPS.
- Bootstrap cai K3s stable, ma hoa Kubernetes Secret at rest, Fail2ban, UFW va security update.
- Deploy chi chap nhan tag bat bien `sha-*`, cho rollout/HTTPS readiness va tu tra API/worker ve image cu neu loi.
- Secret ung dung luu tai `/opt/supporthr/shared/supporthr-secret.env` tren VPS; GitHub chi giu SSH inputs.
- `compose.production.yaml` va cac script Compose duoc giu lam phuong an break-glass, khong phai runtime mac dinh.

Tao `/opt/supporthr/shared/supporthr-secret.env` tu `deploy/vps/k3s-secret.env.example` va dat quyen `chmod 600`.
Sau do chay `deploy/vps/prepare-k3s-secrets.sh`. Can set:

- Gemini keys.
- Supabase URL, Supavisor pooled database URL va data encryption key.
- Google OAuth credentials.
- Google API keys.

AI runtime vars phai dong bo:

```text
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_EMBEDDING_DIMENSION=768
VECTOR_INDEX_VERSION=gemini-embedding-2-768-v1
RUBRIC_VERSION=v2
VECTOR_STORE_COLLECTION=vectorLibraryRecords
AI_PREPROCESS_CONCURRENCY=4
REQUIRE_CLASSIFIER_READY=true
```

Image build chi lay `api_server`; `BE/ml_pipeline/data`, artifacts va source train khong vao image. Startup
kiem model manifest. Sau deploy, `/health` phai tra `classifier.ready=true`, model version va 24 labels.

Khoi tao VPS Ubuntu/OCI:

```bash
scp -r deploy/vps ubuntu@YOUR_VPS_IP:/tmp/supporthr-vps
ssh ubuntu@YOUR_VPS_IP 'sudo bash /tmp/supporthr-vps/bootstrap-k3s-ubuntu.sh'
```

GitHub environment `production` can secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`, tuy chon
`VPS_PORT`, va variables `API_DOMAIN`, `ACME_EMAIL`. Chi bat `ENABLE_K3S_DEPLOY=true` sau khi VM, DNS,
runtime secret va `ghcr-pull` da san sang. Build `main` thanh cong se tu deploy tag `sha-*`.

`render.yaml` duoc giu tam trong giai doan cutover. Sau khi endpoint K3s dat du smoke test, FE/Android da doi API URL
va rollback da duoc thu, xoa service Render va blueprint legacy.

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

Tao HNSW cosine index cho bang `approved_exemplars`:

```sql
create index concurrently if not exists approved_exemplars_embedding_hnsw
on public.approved_exemplars using hnsw (embedding vector_cosine_ops);
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

## Performance configuration va load gate

Bien can tune theo quota Supabase/Redis va so process:

```text
POSTGRES_POOL_MIN_SIZE=1
POSTGRES_POOL_MAX_SIZE=15
POSTGRES_POOL_MAX_WAITING=60
POSTGRES_POOL_TIMEOUT_SECONDS=5
POSTGRES_STATEMENT_TIMEOUT_MS=15000
REDIS_MAX_CONNECTIONS=50
SETTINGS_CACHE_TTL_SECONDS=600
MAX_PAGE_SIZE=200
GZIP_MINIMUM_SIZE=1024
GZIP_COMPRESSION_LEVEL=5
```

Docker Compose/K3s production luon co web API va `supporthr-analysis-worker`; ca hai dung
`ANALYSIS_JOB_MODE=redis`. Khong chay queue production ma thieu worker.

Chay contract test va load test doc an toan:

```powershell
cd Software\Web\BE\api_server
.\venv\Scripts\python.exe -m pytest -q
k6 run -e BASE_URL=http://127.0.0.1:8000 -e ACCESS_TOKEN=<supabase_access_token> loadtests\k6-critical-api.js
```

Gate mac dinh k6: error < 1%, check > 99%, p95 < 750 ms va p99 < 1500 ms. Day chi la gate ban dau;
can chay tren staging cung quota/data gan production truoc khi thay doi pool/HPA.
- Exemplar pending-by-default va vector contract.
- Feedback API.

## Checklist demo

Truoc khi thuyet trinh:

- Backend `/health` tra `ok`.
- Frontend chay duoc.
- Dang nhap Supabase duoc.
- Upload mot JD va mot CV mau duoc.
- `/api/files/extract-text` tra text.
- Analysis job ve `completed`.
- Dashboard hien candidates.
- Feedback/gui chatbot khong loi.
- Neu demo Google Drive, OAuth redirect URI khop domain dang dung.

## Loi thuong gap

### Backend 401 Supabase

Nguyen nhan:

- Thieu `SUPABASE_URL` hoac JWKS/redirect config sai.
- Token frontend het han.
- Domain/cau hinh Supabase sai.

Huong xu ly:

- Kiem tra env Supabase backend.
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
