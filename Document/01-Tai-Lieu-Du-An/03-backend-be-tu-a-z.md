# 03 - Backend BE tu A-Z

> Backend hiện hỗ trợ hai provider. `AUTH_PROVIDER` chọn Firebase hoặc Supabase JWT/JWKS; `DATA_PROVIDER` chọn Firestore hoặc PostgreSQL. Mặc định vẫn là Firebase/Firestore để deploy code trước và cutover dữ liệu sau.

Backend nam tai:

```text
Software/Web/BE/api_server
```

Cong nghe chinh:

- FastAPI.
- Uvicorn.
- Pydantic.
- Firebase Admin SDK.
- Cloud Firestore.
- PostgreSQL/Supabase, psycopg pool và pgvector.
- Google Gemini.
- Google Drive OAuth/API.
- PyMuPDF va python-docx cho trich text.
- scikit-learn/joblib cho classifier local.

## Diem vao ung dung

File chinh:

```text
app/main.py
```

Nhiem vu:

- Tao `FastAPI(title=settings.app_name)`.
- Gan CORS cho localhost, domain production va Google Drive allowed origins.
- Mount 5 router chinh:
  - `ai_router`
  - `files_router`
  - `account_router`
  - `mobile_jd_router`
  - `salary_router`
- Cung cap health check:
  - `GET /health`
  - `GET /health/live`
  - `GET /health/ready`

## Cau truc backend

```text
api_server/
|- app/
|  |- api/
|  |  |- deps.py
|  |  `- routes/
|  |     |- ai.py
|  |     |- files.py
|  |     `- account/
|  |- core/
|  |  `- config.py
|  |- integrations/
|  |  `- firebase_admin.py
|  |- repositories/
|  |  `- firestore/
|  |- schemas/
|  |- services/
|  |  |- account/
|  |  |- analysis_job_service.py
|  |  |- cv_pipeline_service.py
|  |  |- cv_analysis_service.py
|  |  |- candidate_enrichment_service.py
|  |  |- file_extraction_service.py
|  |  |- gemini_service.py
|  |  |- local_classifier_service.py
|  |  `- workflow_service.py
|  `- main.py
|- data/
|- docs/
|- tests/
|- requirements.txt
|- .env.example
`- render.yaml
```

## Config va bien moi truong

File:

```text
app/core/config.py
```

Backend doc `.env` bang `python-dotenv`, sau do gom thanh object `Settings`.

Nhom bien quan trong:

- `APP_NAME`: ten backend.
- `FRONTEND_ORIGIN`: domain frontend.
- `GEMINI_MODEL`, `GEMINI_CV_ANALYSIS_MODEL`, `GEMINI_EMBEDDING_MODEL`.
- `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY`.
- Firebase Admin: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`.
- Google Drive OAuth: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`.
- Vector/RAG: `VECTOR_STORE_PROVIDER`, `VECTOR_STORE_FIRESTORE_COLLECTION`, `APPROVED_EXEMPLARS_COLLECTION`, `RAG_SIMILARITY_THRESHOLD`.
- Classifier: `LOCAL_CLASSIFIER_MODE`, `LOCAL_CLASSIFIER_REMOTE_CLASSIFY_URL`, `LOCAL_CLASSIFIER_CONFIDENCE_THRESHOLD`.

## Router AI

File:

```text
app/api/routes/ai.py
```

Prefix:

```text
/api
```

Nhom endpoint:

- Gemini direct:
  - `POST /api/gemini-chat`
  - `POST /api/gemini-embed`
- JD workflow:
  - `POST /api/jd/structure`
  - `POST /api/jd/position`
  - `POST /api/jd/hard-filters`
- Interview:
  - `POST /api/interview/questions`
- CV analysis:
  - `POST /api/cv/analyze-core`
  - `POST /api/cv/analyze-core-async`
  - `POST /api/analysis/jobs`
  - `GET /api/analysis/status/{job_id}`
- CV refine/classifier/enrich:
  - `POST /api/cv/refine-profile`
  - `GET /api/cv/classifier-status`
  - `POST /api/cv/classify-industry`
  - `POST /api/cv/enrich`

## Router file

File:

```text
app/api/routes/files.py
```

Endpoint:

```text
POST /api/files/extract-text
```

Input:

- `file`: UploadFile.
- `force_ocr`: co ep OCR khong.
- `document_type`: `cv` hoac `jd`.

Output:

- `text`: text da trich xuat va lam sach.

## Router account

File tong:

```text
app/api/routes/account/__init__.py
```

Prefix:

```text
/api/account
```

Router con:

- `profile.py`: profile, avatar, CV history, migrate local data.
- `sync.py`: sync cache/history/stats.
- `history.py`: history, manual snapshot, feedback.
- `uploaded_files.py`: file metadata, vectorize, stats.
- `templates.py`: JD templates.
- `chatbot.py`: chatbot sessions.
- `google_drive.py`: OAuth Drive, list file, import file.

## Auth backend

File:

```text
app/api/deps.py
```

Co 2 dependency:

- `get_current_user`: bat buoc co `Authorization: Bearer <firebase_id_token>`.
- `get_optional_current_user`: co token thi verify, khong co thi van cho tiep tuc.

Backend dung `verify_firebase_token` trong `integrations/firebase_admin.py`.

Y nghia khi thuyet trinh:

- API public nhu phan tich CV co the chay optional auth.
- API account bat buoc auth de gan du lieu dung user.

## Service Gemini

File:

```text
app/services/gemini_service.py
```

Nhiem vu:

- Goi Gemini generate content.
- Goi Gemini embedding.
- Quan ly API key fallback.
- Sanitize schema/config truoc khi goi model.
- Fallback model neu model cu khong con phu hop.

## Service OCR va trich file

File:

```text
app/services/file_extraction_service.py
```

Ho tro:

- PDF: doc text layer bang PyMuPDF; neu khong du thi render trang dau va OCR bang Gemini Vision.
- DOCX: doc paragraph va table bang python-docx.
- Anh: OCR bang Gemini Vision.
- TXT/CSV: decode bang utf-8, utf-8-sig, latin-1.

Gioi han file hien tai:

- Toi da 15MB.
- PDF OCR toi da 3 trang dau khi can.

## Service workflow JD

File:

```text
app/services/workflow_service.py
```

Nhiem vu:

- `structure_jd`: chuan hoa JD thanh cac phan ro rang.
- `extract_job_position`: lay ten vi tri.
- `extract_hard_filters`: rut yeu cau cung nhu dia diem, kinh nghiem, hoc van, ngon ngu, luong.
- `generate_interview_questions`: tao cau hoi phong van theo ket qua phan tich.

## Pipeline phan tich CV

File quan trong nhat:

```text
app/services/cv_pipeline_service.py
```

Ham chinh:

```python
run_smart_cv_analysis(...)
```

Luong xu ly:

1. Khoi tao metadata pipeline: cache, RAG, model, warning.
2. Resolve rubric `v2`: template mac dinh theo 8 role hoac recruiter override, tong trong so bat buoc bang 100.
3. Tao cache key theo hash noi dung CV/JD, weights, hard filters, rubric, prompt, classifier va pipeline version.
4. Neu co user, doc cache tu Firestore.
5. Voi CV chua co cache (toi da 4 CV tien xu ly song song):
   - Chuan hoa ngon ngu.
   - Chay classifier mot lan va embedding mot lan; routing/RAG/enrichment tai su dung ket qua.
   - Tim approved RAG exemplars bang Firestore native vector search.
   - Goi Gemini phan tich core.
   - Neu Gemini loi, dung rule-based fallback.
6. Enrich ung vien bang `candidate_enrichment_service` va tai su dung CV vector.
7. Gan location detected va location match.
8. Gan `finalScore`, `rankGrade`: A >= 75, B >= 50, con lai C (quick/full dung chung policy).
9. Attach `advancedScoreBreakdown`.
10. Ghi cache theo lo, cleanup/refresh view mot lan.
11. Luu history vao Firestore neu user hop le.
12. Sort candidates theo diem giam dan.

## Async analysis job

File:

```text
app/services/analysis_job_service.py
```

Y tuong:

- Frontend gui request phan tich lon.
- Backend tra ve ngay `202 Accepted` va `job_id`.
- Che do local/Render tuong thich co the chay `asyncio.create_task`.
- Che do scale ghi job vao Redis Stream va worker xu ly bang consumer group.
- Frontend poll `GET /api/analysis/status/{job_id}`.
- Neu user dang nhap, job snapshot duoc luu vao Firestore `analysisJobs`.

Trong Docker/Kubernetes, Redis giu payload va state ngan han, consumer group giu message pending, worker khac
co the reclaim job bi bo do sau lease. Gioi han dong thoi theo user cung nam tren Redis thay vi bo dem tung process.
Chi acknowledge message sau khi worker xu ly xong. Quyet dinh duoc ghi trong ADR-002.

Trang thai:

- `queued`
- `processing`
- `completed`
- `failed`

## Docker va Kubernetes

- `docker-compose.yml`: API, worker va Redis local co healthcheck va startup dependency.
- `api_server/Dockerfile`: multi-stage image, user non-root, cung image cho API/worker.
- `deploy/kubernetes/base`: Deployment API/worker, Service, HPA, PDB, NetworkPolicy va probes.
- `deploy/kubernetes/overlays/local`: Redis noi bo va image `supporthr-backend:local`.
- `deploy/kubernetes/overlays/production`: namespace va image registry/tag can duoc chot khi release.
- Production phai dung managed Redis, secret manager, Metrics Server va ingress/TLS cua cluster thuc te.

## Core CV analysis

File:

```text
app/services/cv_analysis_service.py
```

Nhiem vu:

- Tao prompt cham diem CV theo JD va weights.
- Yeu cau Gemini tra ve JSON dung schema.
- Tach/repair JSON neu model tra ve thua text.
- Tao fallback rule-based candidates neu AI loi.
- Chuan hoa diem theo weights.
- Sinh `advancedBreakdown`: matched signals, missing requirements, evidence highlights, deductions, verdict.
- Sua cac giai thich qua chung chung bang bang chung cu the hon.

## Candidate enrichment

File:

```text
app/services/candidate_enrichment_service.py
```

Nhiem vu:

- Kiem tra bias risk tu hard filters.
- Phan tich soft skills.
- Tinh career velocity.
- Tinh company tier.
- Tinh industry/classifier fit.
- Tim embedding similarity.
- Cong/tru diem bonus phu hop.
- Dong bo alias field tieng Viet/khong dau/loi encoding de FE van doc duoc.

## Classifier noi bo

File:

```text
app/services/local_classifier_service.py
```

Che do:

- `local`: load model `.pkl` trong backend.
- `remote`: goi service phan loai o URL rieng.
- `auto`: tu fallback.

Local mode chi san sang khi `text_classifier_model.manifest.json` khop SHA-256, schema, labels va
`scikit-learn==1.6.1`. Model duoc warm mot lan luc startup; `/health` tra 503 neu local classifier bat buoc
nhung khong san sang.

Endpoint lien quan:

- `GET /api/cv/classifier-status`
- `POST /api/cv/classify-industry`

## Vector store va RAG

File lien quan:

- `vector_store_service.py`
- `vector_index_service.py`
- `analysis_grounding_service.py`

Y tuong:

- He thong co the doc vector tu JSON hoac Firestore.
- Production dung Firestore `find_nearest`; JSON/scan cuc bo chi chap nhan vector cung contract va dung cho local/test.
- Neu similarity vuot nguong, dua exemplar vao prompt de AI cham on dinh hon.
- `approvedExemplars` phai co `approved=true`, `status=approved`, rubric/model/dimension/index version dung.
- Contract hien tai: `gemini-embedding-2`, 768 chieu, `gemini-embedding-2-768-v1`, rubric `v2`.
- Record thieu trang thai duyet hoac khac embedding space bi loai, khong fallback thanh approved.

## Rubric cham diem

- `GET /api/rubrics`: danh sach 8 template role.
- `GET /api/rubrics/{role_key}`: template cu the.
- `rubric_service.py` chon template theo JD/hard filters; weights rong dung template, weights gui len la override.
- Override phai co tong 100 va pipeline ghi `overrideDiff` de HR audit.

## Firestore repository

File:

```text
app/repositories/firestore/account_repository.py
```

Cac collection dang dung:

- `users`
- `cvHistory`
- `syncedAnalysisCache`
- `syncedAnalysisHistory`
- `uploadedFiles`
- `userJDTemplates`
- `chatbotSessions`
- `googleDriveConnections`
- `googleDriveOAuthStates`
- `analysisFeedback`
- `approvedExemplars`
- `analysisJobs`

## Diem manh backend de noi voi ban giam khao

- Code co chia tang ro: route, schema, service, repository, integration.
- API key va Firebase Admin nam o backend, khong day het len frontend.
- Pipeline co cache, async job va fallback neu AI loi.
- Co explainability: diem khong chi la con so ma co bang chung va missing requirements.
- Co kha nang mo rong: classifier local/remote, vector store JSON/Firestore, RAG approved exemplars.
