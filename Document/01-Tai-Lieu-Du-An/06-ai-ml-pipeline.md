# 06 - AI va ML pipeline

> Supabase migration giữ nguyên 115 vector nguồn `gemini-embedding-001` 3072 chiều trong `legacy_embedding` và `source_payload`. Runtime tạo vector 768 chiều theo contract hiện tại vào cột pgvector, dùng HNSW cosine; không ép hoặc cắt vector legacy sang sai dimension.

Phan AI/ML cua SupportHR co nhieu lop, khong chi goi mot API duy nhat.

## Tong quan cac lop thong minh

1. OCR/trich xuat text.
2. Chuan hoa JD.
3. Rut hard filters.
4. Normalize ngon ngu CV.
5. Local classifier/TF-IDF routing metadata.
6. RAG approved exemplars.
7. Gemini core analysis.
8. Rule-based fallback.
9. Candidate enrichment.
10. Advanced score breakdown.
11. Feedback loop.

## OCR va file extraction

Service:

```text
app/services/file_extraction_service.py
```

Y nghia:

- Chuyen PDF/DOCX/image/TXT/CSV thanh text.
- Neu PDF scan khong co text layer, dung Gemini Vision OCR.
- Text sau OCR duoc lam sach truoc khi vao AI.

Day la lop quan trong vi neu text dau vao sai, diem AI phia sau cung sai.

## Gemini workflow

Service:

```text
app/services/gemini_service.py
app/services/workflow_service.py
app/services/cv_analysis_service.py
```

Gemini duoc dung cho:

- Chuan hoa JD.
- Rut vi tri tuyen dung.
- Rut hard filters.
- Phan tich CV theo JD.
- Sinh cau hoi phong van.
- OCR vision.
- Embedding text.

Model mac dinh trong config:

- `gemini-3.6-flash` cho generate, CV analysis va OCR multimodal. Backend bo cac sampling parameter da deprecated (`temperature`, `top_p`, `top_k`) khi goi model nay.
- `gemini-embedding-2` cho embedding, output 768 chieu.

Backend chi dung SDK `google-genai`. `google-generativeai` cu da duoc loai. Embedding 2 dung task prefix trong
text; backend va script seed phai dung cung format. Vector cua `gemini-embedding-001` khong tuong thich va
bat buoc re-embed, khong duoc tron hai space.

## ML classifier rieng

Workspace:

```text
Software/Web/BE/ml_pipeline
```

Script:

```text
train_classifier.py
seed_exemplars.py
```

Muc dich:

- Train model phan loai nganh nghe CV.
- Xuat artifact `.pkl`.
- Audit label, duplicate va conflicting-label text.
- Gate holdout macro-F1 truoc khi release.
- Xuat artifact vao `BE/api_server/app/models` kem manifest SHA-256.
- Yeu cau `--dataset-license` khi train release.

Cong nghe:

- TF-IDF vectorizer.
- Logistic Regression class-balanced.
- scikit-learn Pipeline.
- joblib de save model.

Output mac dinh:

```text
api_server/app/models/text_classifier_model.pkl
api_server/app/models/text_classifier_model.manifest.json
ml_pipeline/artifacts/dataset_audit.json
ml_pipeline/artifacts/evaluation.json
```

`ml_pipeline/data` va `ml_pipeline/artifacts` bi Git ignore. Docker/Render build context la `api_server`, vi
vay ma train va data raw khong vao production image. Workspace `Software/Web/ml_pipeline` cu chi la nguon
du lieu legacy; khong con la code train canonical.

## Classifier trong backend

Service:

```text
app/services/local_classifier_service.py
```

Classifier co 3 che do:

- `local`: load `.pkl` truc tiep trong backend.
- `remote`: goi service classifier ngoai.
- `auto`: uu tien local/remote theo config va fallback khi can.

Classifier khong thay the AI. No la tin hieu ho tro:

- Du doan nganh nghe.
- Tao routing metadata.
- Giup RAG chon dung collection/exemplar.
- Bo sung industry fit insight.

Runtime local kiem manifest schema, SHA-256, scikit-learn version va danh sach label truoc khi load. Model
duoc warm luc startup. Neu `REQUIRE_CLASSIFIER_READY=true`, model loi lam `/health` khong ready thay vi am
tham bo qua.

## RAG approved exemplars

Service:

```text
app/services/analysis_grounding_service.py
```

Y tuong:

- He thong co the luu cac mau CV/phan tich da duyet trong collection `approvedExemplars`.
- Record canonical co `schemaVersion`, `approved`, `status`, `rubricVersion`, `embeddingModel`,
  `embeddingDimension`, `vectorIndexVersion`, role/industry/seniority va CV da redact PII.
- Thieu `approved=true` hoac `status=approved` mac dinh la khong duoc dung.
- Khi phan tich CV moi, backend goi PostgreSQL native `find_nearest`, khong stream toan collection.
- Neu similarity vuot `RAG_SIMILARITY_THRESHOLD`, backend dua few-shot example vao prompt.
- Neu khong dat nguong, pipeline chay zero-shot.

Loi ich:

- AI cham on dinh hon.
- Rubric co the hoc tu cac case tot da duyet.
- Giam tinh tuy tien trong prompt.

## Vector similarity

Service:

```text
app/services/vector_store_service.py
app/services/vector_index_service.py
```

Cach tinh:

- Embed CV/query.
- Tai su dung cung CV vector cho RAG va enrichment; JD vector chi tao mot lan/batch.
- Production lay vector record tu PostgreSQL; JSON chi hop le neu co dung vector contract.
- Tinh cosine similarity.
- Lay top matches.
- Doi average similarity thanh bonus points.

Quy tac bonus trong docs backend:

```text
>= 0.88 -> +5.0
>= 0.83 -> +3.5
>= 0.78 -> +2.0
>= 0.72 -> +1.0
<  0.72 -> +0.0
```

## Rubric versioned

`rubric_service.py` cung cap 8 template: backend, frontend, fullstack, QA, data analyst, digital marketing,
sales executive va UI/UX. Moi template co 100 diem; 35 diem ky nang duoc chia theo requirements cua role.
Weights rong se dung template duoc suy ra tu JD. Recruiter co the gui full override, nhung tong phai bang 100;
pipeline luu `source` va `overrideDiff` de truy vet.

Rank policy dung chung cho quick/full: A tu 75, B tu 50, con lai C.

## Tai su dung ket qua va cache

- Moi CV miss cache: classifier mot lan, embedding mot lan; toi da `AI_PREPROCESS_CONCURRENCY=4`.
- Routing TF-IDF khong goi them Gemini translate sau khi CV da normalize.
- Cache key gom CV text hash, JD, weights, hard filters, rubric, prompt, classifier va pipeline version.
- Cache writes chay dong thoi; cleanup va refresh view chi mot lan sau batch.

## Core CV scoring

Service:

```text
app/services/cv_analysis_service.py
```

Input:

- JD text.
- Weights.
- Hard filters.
- Danh sach CV text.
- Context tu classifier/RAG.

Output cho moi ung vien:

- Thong tin ung vien.
- Diem tong.
- Hang A/B/C.
- Chi tiet tung tieu chi.
- Diem manh, diem yeu.
- Interview questions.
- Evidence va explanation.

## Rule-based fallback

Neu Gemini loi, backend khong de ca pipeline sap. Thay vao do, `build_rule_based_fallback_candidates` tao ket qua dua tren:

- Keyword overlap.
- Kinh nghiem.
- Hoc van.
- Ky nang.
- Cac tieu chi trong weights.

Khi thuyet trinh, day la diem cong:

"He thong co fallback de demo va su dung thuc te khong bi dung hoan toan khi AI provider gap loi."

## Advanced score breakdown

Moi detail diem co the duoc bo sung:

- `max_possible_score`.
- `raw_score_earned`.
- `mathematical_formula`.
- `deductions`.
- `bonuses_earned`.
- `keyword_metrics`.
- `verdict`.
- `evidence_quality`.
- `matched_signals`.
- `missing_requirements`.
- `evidence_highlights`.
- `improvement_suggestion`.
- `quality_flags`.

Y nghia:

- Giai thich vi sao co diem.
- Chi ra bang chung.
- Chi ra yeu cau con thieu.
- Lam ket qua thuyet phuc hon voi HR.

## Enrichment sau scoring

Service:

```text
app/services/candidate_enrichment_service.py
```

Cac lop enrich:

- Bias warning tu hard filters nhu tuoi/gioi tinh/ton giao.
- Soft-skill heuristics.
- Career velocity.
- Company tier multiplier.
- Skill graph.
- Industry fit/classifier.
- Embedding similarity.
- JD-CV semantic match.

## Feedback loop

Feedback service luu y kien nguoi dung sau khi AI cham:

- Nguoi dung co dong y diem khong.
- Ung vien co duoc shortlist/interview/hire khong.
- Ly do va ghi chu.
- Feedback co tai su dung lam guidance khong.

Sau nay co the dung feedback de:

- Tao approved exemplars.
- Dieu chinh rubric.
- Danh gia model.
- Cai tien prompt.

## Cach noi ngan gon voi ban giam khao

"AI pipeline cua em co nhieu tang. Dau tien trich text va lam sach file, sau do dung Gemini de chuan hoa JD va cham diem CV. Song song, he thong co classifier noi bo de du doan nganh, RAG exemplar de dua mau tham chieu, embedding similarity de so sanh voi thu vien mau, va rule-based fallback khi AI provider loi. Ket qua cuoi cung khong chi co diem ma co bang chung, yeu cau con thieu va giai thich chi tiet."
