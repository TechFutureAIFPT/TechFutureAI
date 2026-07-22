# 04 - API reference de thuyet trinh

> Tai lieu nay la ban giai thich API phuc vu demo, khong thay the OpenAPI/runtime source. Da doi chieu nhom route ngay 2026-07-22 tai `Software/Web/BE/api_server/app/api/routes`. Khi route, auth hoac schema thay doi, cap nhat file nay theo `11-MA-TRAN-TRUY-VET.md`.

Ngoai cac luong cot loi ben duoi, backend hien con co nhom quick CV, candidate chat, mobile JD, salary, notifications va email. Tra source route khi can danh sach day du nhat.

Backend base local:

```text
http://localhost:8000
```

Backend production dang duoc FE fallback toi:

```text
https://backendsupporthr.onrender.com
```

## Health check

### `GET /health`

Dung de kiem tra backend con song khong.

Response:

```json
{
  "status": "ok",
  "classifier": {},
  "queue": {}
}
```

### `GET /health/live`

Chi xac nhan process HTTP con song. Kubernetes dung endpoint nay cho startup/liveness probe.

### `GET /health/ready`

Xac nhan classifier san sang va, khi `ANALYSIS_JOB_MODE=redis`, Redis queue dang ket noi. Pod khong ready
se khong nhan traffic tu Kubernetes Service.

## Nhom file/OCR

### `POST /api/files/extract-text`

Muc dich: bien file CV/JD thanh plain text.

Input `multipart/form-data`:

- `file`: file PDF/DOCX/image/TXT/CSV.
- `force_ocr`: `true/false`.
- `document_type`: `cv` hoac `jd`.

Output:

```json
{
  "text": "noi dung file da trich xuat"
}
```

Dung khi demo:

- Noi rang day la buoc dau tien, vi AI khong cham truc tiep file ma cham tren text da lam sach.

## Nhom JD

### `POST /api/jd/structure`

Muc dich: chuan hoa JD tho thanh JD co cau truc.

Body:

```json
{
  "raw_text": "noi dung JD goc"
}
```

Output:

```json
{
  "structured_text": "JD da chia phan ro rang"
}
```

### `POST /api/jd/position`

Muc dich: rut ten vi tri tu JD.

Body:

```json
{
  "jd_text": "JD da co text"
}
```

Output:

```json
{
  "job_position": "Backend Developer"
}
```

### `POST /api/jd/hard-filters`

Muc dich: rut cac yeu cau cung.

Body:

```json
{
  "jd_text": "JD da co text"
}
```

Output dang y tuong:

```json
{
  "filters": {
    "location": "Ha Noi",
    "minExp": "2",
    "seniority": "Junior/Mid",
    "education": "Dai hoc",
    "industry": "IT",
    "language": "English"
  }
}
```

## Nhom CV analysis

### `GET /api/rubrics`

Tra 8 template cham diem theo role cua rubric active. Moi template co `roleKey`, `roleLabel`, `totalWeight=100`
va `weights` theo ky nang/kinh nghiem/bang chung. Endpoint public, dung de FE hien template mac dinh.

### `GET /api/rubrics/{role_key}`

Tra mot template theo `role_key`, vi du `backend_developer`, `qa_engineer`, `sales_executive`. Tra 404 neu
role khong ton tai.

### `POST /api/cv/analyze-core`

Muc dich: phan tich dong bo, tra ket qua khi xong.

Body:

```json
{
  "jd_text": "JD da chuan hoa",
  "weights": {},
  "hard_filters": {},
  "cv_entries": [
    {
      "file_name": "cv-a.pdf",
      "text": "noi dung CV",
      "cv_id": "optional-id",
      "file_id": "optional-file-id"
    }
  ]
}
```

`weights={}` nghia la backend tu suy role tu JD/hard filters va dung template `v2`. Neu gui weights, backend
xem do la recruiter override va tra 422 neu tong trong so khong bang 100.

Output:

```json
{
  "candidates": [],
  "pipeline": {
    "cacheEnabled": true,
    "cacheHits": 0,
    "cacheMisses": 1,
    "geminiCalls": 1,
    "classifierCalls": 1,
    "embeddingCalls": 1,
    "rubric": {
      "version": "v2",
      "roleKey": "backend_developer",
      "source": "role_template",
      "overrideDiff": []
    },
    "durationMs": 12345
  }
}
```

### `POST /api/cv/analyze-core-async`

Muc dich: phan tich bat dong bo, phu hop khi nhieu CV hoac mat thoi gian lau.

Output:

```json
{
  "job_id": "uuid",
  "status": "queued",
  "status_url": "/api/analysis/status/uuid"
}
```

### `POST /api/analysis/jobs`

Alias queue-oriented cua `analyze-core-async`. Chuc nang tuong tu, cung tra `job_id`. Trang thai co the la
`queued`, `processing`, `completed` hoac `failed`.

### `GET /api/analysis/status/{job_id}`

Muc dich: frontend poll trang thai job.

Output khi dang xu ly:

```json
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 0.1,
  "message": "Module 1: translating documents and building local routing metadata.",
  "result": null,
  "error": null
}
```

Output khi xong:

```json
{
  "job_id": "uuid",
  "status": "completed",
  "progress": 1,
  "message": "Analysis completed.",
  "result": {
    "candidates": [],
    "pipeline": {}
  },
  "error": null
}
```

## Nhom classifier/refine/enrich

### `GET /api/cv/classifier-status`

Muc dich: kiem tra model classifier san sang chua.

Output:

```json
{
  "ready": true,
  "model_source": "local://classifier",
  "label_count": 24,
  "labels": ["IT", "SALES"],
  "error": null
}
```

### `POST /api/cv/classify-industry`

Muc dich: phan loai nganh nghe CV.

Body:

```json
{
  "cv_text": "noi dung CV",
  "top_k": 3
}
```

### `POST /api/cv/refine-profile`

Muc dich: lam sach ten ung vien va hoc van.

Body:

```json
{
  "cv_text": "noi dung CV",
  "current_education": "Bachelor",
  "current_name": "CV_CNTT1"
}
```

### `POST /api/cv/enrich`

Muc dich: bo sung diem/insight sau core analysis.

Luu y: endpoint nay bat buoc auth vi can owner uid de search vector theo user.

## Nhom interview

### `POST /api/interview/questions`

Muc dich: sinh cau hoi phong van.

Input gom:

- `analysis_data`: ket qua ung vien.
- `analysis_stats`: thong ke.
- `question_type`: general/specific/comparative.
- `candidate_data`: ung vien cu the neu can.

Output:

```json
{
  "question_sets": []
}
```

## Nhom account/profile

Tat ca route account nam sau:

```text
/api/account
```

Và thường cần `Authorization: Bearer <access_token>`; issuer là Supabase, còn route/request/response giữ nguyên.

### Settings va dong bo an toan

- `GET /api/account/settings`: tra `ETag`; `If-None-Match` khop revision tra `304`.
- `PATCH /api/account/settings`: nen gui `If-Match: <etag>`; revision cu tra `412 Precondition Failed`.
- `POST /api/account/settings/reset`: cung ho tro `If-Match`; lock ghi dang ban tra `409` kem `Retry-After`.

Response API expose `ETag`, `X-Data-Revision`, `X-Cache-Status`, `Server-Timing` va
`X-Process-Time-Ms`. JSON lon duoc gzip khi client gui `Accept-Encoding: gzip`.

### Profile

- `GET /api/account/profile`
- `PUT /api/account/profile`
- `PATCH /api/account/profile/avatar`
- `POST /api/account/profile/cv-history`
- `GET /api/account/profile/cv-history`
- `POST /api/account/profile/cv-history/cleanup`
- `POST /api/account/profile/migrate-local`

### Sync/cache/history

- `POST /api/account/sync/cache`
- `GET /api/account/sync/cache/{cache_key}`
- `GET /api/account/sync/cache`
- `DELETE /api/account/sync/cache`
- `POST /api/account/sync/history`
- `GET /api/account/sync/history`
- `GET /api/account/sync/stats`

### History va feedback

- `POST /api/account/history`
- `GET /api/account/history`
- `GET /api/account/history/page?page_size=50&cursor=...&fields=id,jobPosition,updatedAt`
- `POST /api/account/history/manual-snapshot`
- `GET /api/account/history/manual`
- `POST /api/account/history/feedback`
- `GET /api/account/history/feedback`
- `GET /api/account/history/feedback/stats`
- `DELETE /api/account/history/feedback/{feedback_id}`

### Uploaded files

- `POST /api/account/uploaded-files`
- `POST /api/account/uploaded-files/batch`
- `POST /api/account/uploaded-files/vector-index/rebuild`
- `GET /api/account/uploaded-files`
- `GET /api/account/uploaded-files/page?page_size=50&cursor=...&fields=id,fileName,fileType,updatedAt`
- `GET /api/account/uploaded-files/by-type/{file_type}`
- `GET /api/account/uploaded-files/by-session/{session_id}`
- `DELETE /api/account/uploaded-files/{file_id}`
- `POST /api/account/uploaded-files/{file_id}/touch`
- `PATCH /api/account/uploaded-files/{file_id}/touch`
- `POST /api/account/uploaded-files/{file_id}/vectorize`
- `GET /api/account/uploaded-files/stats`

### JD templates

- `GET /api/account/jd-templates`
- `GET /api/account/jd-templates/page?page_size=50&cursor=...&fields=id,name,jobPosition,updatedAt`
- `POST /api/account/jd-templates`
- `PATCH /api/account/jd-templates/{template_id}`
- `DELETE /api/account/jd-templates/{template_id}`
- `POST /api/account/jd-templates/seed-defaults`

Ba route `/page` dung keyset cursor `(updated_at, id)`, khong dung offset o bang lon. `fields` chi nhan
allowlist va database chi tao JSON voi cac field da chon; `page_size` toi da 200.

### Chatbot

- `POST /api/account/chatbot/sessions`
- `POST /api/account/chatbot/sessions/{session_id}/messages`
- `GET /api/account/chatbot/sessions`
- `GET /api/account/chatbot/sessions/{session_id}`
- `GET /api/account/chatbot/recent`
- `DELETE /api/account/chatbot/sessions/{session_id}`
- `GET /api/account/chatbot/stats`

### Google Drive

- `GET /api/account/google-drive/status`
- `POST /api/account/google-drive/oauth-url`
- `POST /api/account/google-drive/exchange-code`
- `DELETE /api/account/google-drive/connection`
- `GET /api/account/google-drive/files`
- `POST /api/account/google-drive/import`

## Cach giai thich API khi thuyet trinh

Ban co the noi:

"Backend duoc chia endpoint theo nghiep vu. Route `/api/files` phu trach dua file ve text. Route `/api/jd` chuan hoa JD va lay bo loc. Route `/api/cv` chay pipeline phan tich CV. Route `/api/account` luu toan bo du lieu theo user nhu history, cache, file, template, chatbot va feedback. Cach chia nay giup frontend goi API ro rang, con backend kiem soat duoc auth, database va AI provider."
