# 05 - Frontend Web FE từ A-Z

> Gate migration: `Software/Web/FE` đang thiếu trong checkout ngày 2026-07-22. Phần Supabase Web Auth/session chưa được áp dụng và cutover bị chặn cho tới khi thư mục này được khôi phục. Android và backend không được xem là hoàn tất toàn hệ thống nếu chưa qua Web FE build.

> Cập nhật ngày 2026-07-22 theo checkout hiện tại tại `Software/Web/FE`. Frontend được tái tạo từ contract runtime của backend và 19 đặc tả trang trong `Document/04-Dac-Ta-Trang-FE`.

## Công nghệ và cách chạy

- React 19 + TypeScript 7.
- Vite 8.
- React Router 7.
- Lucide icons và Framer Motion 12 (có reduced-motion fallback).
- CSS design tokens và responsive layout, không phụ thuộc component framework.

```powershell
cd "D:\Support HR\Software\Web\FE"
Copy-Item .env.example .env.local
npm install
npm run dev
```

Frontend local mặc định là `http://localhost:3000`. Backend local mặc định là `http://localhost:8000`; có thể đổi bằng `VITE_API_URL`.

## Điểm vào và kiến trúc

- `src/main.tsx`: gắn React app và BrowserRouter.
- `src/app/App.tsx`: định nghĩa toàn bộ route chức năng.
- `src/components/AppShell.tsx`: sidebar, topbar, tìm kiếm và trạng thái queue.
- `src/components/PublicLayout.tsx`: header, điều hướng, footer và trust notice cho website công khai.
- `src/components/FeaturePage.tsx`: renderer cho trang dữ liệu, gồm loading, empty, preview/offline và live state.
- `src/pages/WorkflowTools.tsx`: form gọi API thật cho JD, quick CV và salary.
- `src/services/api.ts`: API client tập trung, timeout, Bearer token và chuẩn hóa lỗi an toàn.
- `src/data/pages.ts`: nội dung, contract endpoint và dữ liệu demo có nhãn cho các trang.
- `src/data/publicPages.ts`: nội dung website, tài liệu công khai và chính sách/pháp lý.
- `src/styles/global.css`: design tokens, desktop/mobile layout, focus state và reduced motion.

## Routes chức năng

| Nhóm | Route |
| --- | --- |
| Giới thiệu công khai | `/`, `/process`, `/use-cases`, `/pricing`, `/team`, `/contact-ready`, `/book-demo` |
| Tài liệu công khai | `/app-docs`, `/guide`, `/ai-methodology`, `/integrations`, `/faq`, `/docs/cv-library`, `/docs/jd-templates`, `/docs/jd-standardizer` |
| Tin cậy và pháp lý | `/security`, `/privacy-policy`, `/terms` |
| Tổng quan | `/dashboard` |
| JD | `/jobs/new`, `/jobs/:jobId/edit` |
| Tiếp nhận và cấu hình | `/screening/intake`, `/screening/configure` |
| Job phân tích | `/analysis/jobs`, `/analysis/jobs/:jobId` |
| Kết quả ứng viên | `/analysis/:jobId/results`, `/analysis/:jobId/candidates/:candidateId` |
| Phỏng vấn | `/analysis/:jobId/interview-kit` |
| Công cụ | `/tools/quick-cv-score`, `/tools/salary-analysis` |
| Dữ liệu | `/library`, `/history`, `/history/:historyId`, `/templates/jd` |
| Copilot | `/copilot`, `/copilot/:sessionId` |
| Tích hợp/đồng bộ | `/integrations/google-drive`, `/inbox` |
| Quản trị | `/quality/feedback`, `/notifications`, `/settings` |

Website công khai giới thiệu giá trị, quy trình, bảng giá, tài liệu, tích hợp, đội ngũ và nguyên tắc AI rồi dẫn vào workspace hoặc form đặt lịch demo. Các trang bảo mật, quyền riêng tư và điều khoản được tách route; nội dung pháp lý cần được doanh nghiệp/luật sư duyệt lại trước khi đưa lên production. Login/onboarding không được tính là trang chức năng trong bộ đặc tả backend. Các endpoint account vẫn yêu cầu Firebase Bearer token. Bản hiện tại đọc token từ khóa local `supporthr.firebaseToken`; bước tích hợp Firebase auth shell production còn phải hoàn tất trước release.

## Contract dữ liệu

- API client lấy base URL từ `VITE_API_URL`.
- Endpoint `/api/account/*` tự bật chế độ auth; token được đưa vào `Authorization: Bearer`.
- Timeout mặc định 120 giây và không hiển thị raw provider error.
- `VITE_DEMO_MODE=true` cho phép giao diện hiển thị dữ liệu xem trước có nhãn khi backend/account auth chưa sẵn sàng.
- Các form JD, quick CV và salary gửi payload đúng schema backend.
- FE không tính lại `finalScore`; ranking và candidate detail hiển thị snapshot backend.
- Job dài phải dùng `POST /api/analysis/jobs`, poll `GET /api/analysis/status/{job_id}` với `queued`, `processing`, `completed`, `failed`. UI hiện đã mô tả contract; job persistence/list/cancel/retry vẫn là gap backend.

## Design system và accessibility

- Public site dùng navy `#071A2B`, blue `#1967D2`, cyan `#34D3E8`, amber `#F4C95D`; workspace tiếp tục dùng token tương thích hiện có.
- Typography public site: Space Grotesk (display), Inter (body) và JetBrains Mono (metadata).
- Workspace desktop dày thông tin; sidebar chuyển thành drawer trên mobile.
- Có skip link, semantic heading, visible focus, label cho form, `aria-live` cho kết quả async, skeleton loading, empty/error/offline state và reduced-motion.
- Các breakpoint được thiết kế cho 320, 768, 1024 và 1440 px.

## Trạng thái triển khai hiện tại

Đã có đủ route và giao diện cho 19 trang chức năng cùng 18 route công khai/tài liệu/pháp lý. Các trang dữ liệu dùng API contract thật để kiểm tra kết nối nhưng hiển thị dataset xem trước khi chưa có Firebase session. Ba luồng gọi API trực tiếp đã có: chuẩn hóa JD, chấm nhanh CV text và phân tích lương. Thiết kế nguồn được lưu tại Figma `SupportHR Web Redesign 2026`.

Các phần còn thiếu trước production:

1. Firebase client auth/App Check và route guard production.
2. State workflow bền vững giữa JD → CV → config → analysis.
3. Polling job thật có backoff/idempotency và lưu job đang chạy qua refresh.
4. CRUD/data mapping thật cho toàn bộ trang account thay cho preview dataset.
5. Unit/E2E/axe tests và telemetry không chứa PII.

## Kiểm tra

```powershell
npm run typecheck
npm run build
```

Build ngày 2026-07-22: thành công; bundle JS khoảng 440 kB (gzip khoảng 139 kB), CSS khoảng 53 kB (gzip khoảng 11 kB). Phần tăng chủ yếu đến từ Framer Motion và website công khai đầy đủ.

## Prompt UI/UX

Bộ prompt đưa trực tiếp vào Lovable nằm tại `Document/promopt ui ux`: một master design system và một file Markdown cho mỗi trang chức năng, website công khai, tài liệu và pháp lý.
