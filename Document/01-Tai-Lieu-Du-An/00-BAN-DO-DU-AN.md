# 00 - Bản đồ dự án và nguồn sự thật

> Xác minh lần cuối: 2026-07-16. Code/config hiện tại luôn ưu tiên hơn mô tả trong báo cáo cũ.

## Phạm vi sản phẩm đã thống nhất

- **SupportHR Web** là nền tảng chính cho chuẩn hóa JD, upload/import CV, cấu hình trọng số, phân tích, xếp hạng, giải thích, chatbot, feedback và quản lý dữ liệu tuyển dụng.
- **Hipo Tool / Android** là ứng dụng mobile đồng hành cho các thao tác nhanh, JD standardizer, quick CV, inbox, records và đồng bộ với nền tảng.
- **Backend** giữ API, auth verification, AI workflow, OCR, persistence và integrations.
- **ML pipeline** huấn luyện và cung cấp artifact phân loại ngành nghề; không phải UI runtime.

## Code map

| Khu vực | Điểm vào | Trách nhiệm chính |
| --- | --- | --- |
| Web FE | [`Software/Web/FE/src/app/App.tsx`](../../Software/Web/FE/src/app/App.tsx) | React Router, auth gate và workflow tuyển dụng |
| Web FE features | [`Software/Web/FE/src/features`](../../Software/Web/FE/src/features) | Analysis, chat support, criteria, CV management, email, feedback, recruiter |
| Web FE config | [`Software/Web/FE/package.json`](../../Software/Web/FE/package.json) | React 19, Vite 6, build và desktop build |
| Backend | [`Software/Web/BE/api_server/app/main.py`](../../Software/Web/BE/api_server/app/main.py) | FastAPI app, middleware và router registration |
| Backend routes | [`Software/Web/BE/api_server/app/api/routes`](../../Software/Web/BE/api_server/app/api/routes) | `/api/files`, AI/CV/JD, account, mobile JD và salary |
| Backend logic | [`Software/Web/BE/api_server/app/services`](../../Software/Web/BE/api_server/app/services) | AI, OCR, scoring, feedback và workflow services |
| Data layer | [`Software/Web/BE/api_server/app/repositories`](../../Software/Web/BE/api_server/app/repositories) | Firestore/persistence boundaries |
| ML pipeline | [`Software/Web/ml_pipeline`](../../Software/Web/ml_pipeline) | Dataset, training scripts và artifacts |
| Android | [`Software/Android/src/App.tsx`](../../Software/Android/src/App.tsx) | App shell và navigation mobile |
| Android screens | [`Software/Android/src/screens`](../../Software/Android/src/screens) | Quick CV, JD standardizer, advisor, inbox, records, templates và tools |
| Android release | [`Software/Android/app.json`](../../Software/Android/app.json) và [`Software/Android/eas.json`](../../Software/Android/eas.json) | Package, build profile và submission config |

## Stack hiện tại

- Web: React 19 + TypeScript + Vite 6.
- Backend: FastAPI + Pydantic + Firebase Admin + Gemini integrations.
- Mobile: Expo/React Native, package `com.supporthr.companion`.
- Data/auth: Firebase Auth và Firestore, cùng cache/integration tùy môi trường.

## Ranh giới Git

Workspace ngoài có repository cha, đồng thời `Software/Web/FE`, `Software/Web/BE`, `Software/Web/ml_pipeline` và `Software/Android` có thể là repository riêng. Luôn chạy kiểm tra Git tại đúng khu vực trước khi commit hoặc publish.

## Khi báo cáo và code khác nhau

- Báo cáo có thể nhắc Next.js hoặc đường dẫn cũ vì phản ánh thời điểm viết.
- Không sửa báo cáo âm thầm để “khớp code”.
- Cập nhật tài liệu kỹ thuật này và các file `01`–`08`; chỉ sửa báo cáo khi người dùng yêu cầu cập nhật hồ sơ dự thi.
