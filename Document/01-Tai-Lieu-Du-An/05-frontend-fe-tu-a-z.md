# 05 - Frontend Web FE từ A-Z

> Cập nhật ngày 2026-07-24: `Software/Web/FE` là SPA chạy được viết hoàn toàn bằng HTML, CSS và JavaScript chuẩn trình duyệt. Implementation hiện tại được lấy từ repo `TechFutureAIFPT/Support-HR-`, giữ hệ thống nội dung/route và thay React 19 + Vite + TypeScript + Tailwind bằng các script JavaScript thuần.

## Nguồn chuẩn

- Entrypoint và SEO: `Software/Web/FE/index.html`.
- Design system và responsive: `Software/Web/FE/assets/css/styles.css`.
- Router/controller: `Software/Web/FE/assets/js/app.js`.
- FastAPI client: `Software/Web/FE/assets/js/api.js`.
- Firebase Authentication SDK: `Software/Web/FE/assets/js/auth.js`.
- State/localStorage: `Software/Web/FE/assets/js/state.js`.
- Page templates: `Software/Web/FE/assets/js/pages.js`.
- Nội dung tài liệu: `Software/Web/FE/assets/js/content.js`.
- Public runtime config: `Software/Web/FE/config.js`.

Code và hành vi chạy thực tế là nguồn kỹ thuật chuẩn. Contract backend chi tiết nằm tại `Software/Web/BE/api_server/docs/FE-API-CONTRACT.md` và `/openapi.json`.

## Prototype multi-page `Software/Web/Frontend`

Ngoài SPA chính tại `Software/Web/FE`, workspace còn có prototype HTML/CSS/Vanilla JS
tại `Software/Web/Frontend`. Prototype này tổ chức route vật lý theo ba nhóm:

```text
pages/
├── app/            # dashboard và workspace entry
├── functions/      # 19 trang nghiệp vụ recruiter
└── information/    # trust center, phương pháp AI và pháp lý
```

Mỗi file trong `pages/functions` là một route chức năng riêng, khai báo
`data-workspace-view` và dùng chung workspace shell từ `Frontend/js/main.js`.
Cách này giữ route rõ ràng mà không nhân bản sidebar, topbar, modal và logic API.
`Frontend/js/bootstrap.js` chuyển route `file://` sang local HTTP server và có
fail-safe gỡ loading nếu module khởi tạo thất bại.
Trang `Frontend/pages/information/about.html` tập hợp giới thiệu nhóm TechFuture AI,
hình ảnh thực nghiệm tại Bizday, Hackathon 2024, TopCV và hồ sơ thành tích dự án.
Landing `Frontend/index.html` đồng bộ thứ tự và nội dung public từ
`supporthr-tf.com.vn`: Hero, đối tác, nguyên tắc minh bạch, vấn đề, bảng so sánh,
6 nhóm tính năng, quy trình 4 bước, 9 công cụ, Hipo Tools, phản hồi khách hàng và
CTA. `Frontend/css/landing.css` chứa bố cục marketing responsive; các CTA nghiệp
vụ vẫn trỏ tới route vật lý trong `Frontend/pages/functions` và `Frontend/pages/app`.
Bản đồ route đầy đủ nằm tại `Software/Web/Frontend/pages/README.md`.

## Kiến trúc runtime

Frontend không có framework và không có bước build:

```text
index.html
  -> config.js
  -> assets/js/{utils,state,auth,api,content,pages,app}.js
       -> router History API
       -> fallback `?route=` khi mở trực tiếp bằng file://
       -> page templates trong pages.js/content.js
       -> state.js + localStorage
       -> auth.js -> Firebase Authentication SDK
       -> api.js -> FastAPI
  -> assets/css/styles.css
```

Mọi nội dung động được escape trước khi đưa vào template. Event handling dùng delegation ở `app.js`, nên route render lại không tạo listener trùng.

## Phạm vi route

### Public/docs/legal

- Marketing: `/`, `/process`, `/use-cases`, `/pricing`, `/team`, `/contact-ready`, `/book-demo`.
- Docs: `/app-docs`, `/guide`, `/ai-methodology`, `/integrations`, `/faq`.
- Feature docs: `/docs/cv-library`, `/docs/jd-templates`, `/docs/jd-standardizer`.
- Trust/legal: `/security`, `/privacy-policy`, `/terms`.
- Alias tương thích: `/home`, `/welcome`, `/demo`.

### Workspace

- Tổng quan: `/workspace` (`/dashboard` là alias).
- Screening: `/jd`, `/upload`, `/weights`, `/analysis`.
- Review: `/detailed-analytics`, `/chatbot`, `/contact-candidates`, `/feedback`.
- Data/tools: `/records`, `/jd-standardizer`, `/jd-templates`.
- Alias tương thích: `/history` chuyển về `/records`.

Nếu chưa có phiên Firebase, frontend hiển thị màn hình Sign in/Sign up giống layout gốc và cho phép chế độ dùng thử. Chế độ dùng thử chỉ dùng endpoint AI public và localStorage; không giả lập dữ liệu tài khoản từ server.

## Contract API chính

Base URL đọc từ `window.SUPPORTHR_CONFIG.API_BASE_URL`; mặc định hiện là:

```text
https://backendsupporthr.onrender.com
```

Frontend không nối sẵn `/api` vào base URL vì health route nằm ngoài `/api`.

Luồng screening:

```text
POST /api/files/extract-text
POST /api/jd/structure
POST /api/jd/position
POST /api/jd/hard-filters
GET  /api/rubrics
POST /api/analysis/jobs
GET  /api/analysis/status/{job_id}
```

Analysis polling dừng khi `completed`, `failed`, người dùng hủy theo dõi hoặc quá 10 phút. Frontend không tự retry mutation.

Các chức năng tài khoản dùng:

- `/api/account/uploaded-files*`
- `/api/account/jd-templates*`
- `/api/account/history*`
- `/api/account/chatbot*`
- `/api/account/email/send`

Tất cả request account phải có `Authorization: Bearer <Firebase ID token>`.

## Auth

`assets/js/auth.js` gọi Firebase Authentication SDK bằng Firebase web config public trong `config.js`.

Không được đưa các giá trị sau vào frontend:

- Firebase service-role key.
- `DATABASE_URL`.
- Gemini/API provider secret.
- Google OAuth client secret.
- `DATA_ENCRYPTION_KEY`.

Nếu chưa có Firebase web config, form login thông báo rõ chưa cấu hình; luồng dùng thử public vẫn chạy.

## State và dữ liệu

`state.js` giữ:

- trạng thái health live/ready;
- JD đã chuẩn hóa, vị trí và hard filters;
- CV text sau khi extract;
- role/rubric và trọng số;
- analysis job/progress/result;
- history/template cục bộ;
- theme và guest mode.

State được lưu dưới key versioned `supporthr-vanilla-state-v1`. Dữ liệu account thật luôn đọc/ghi qua backend sau khi có token.

## UI và accessibility

- Giữ màu xanh/trắng, typography, card, hero, docs shell và workspace shell của FE gốc.
- Semantic header/nav/main/section/form/label/button.
- Skip link, focus-visible, live region, loading/error/empty state.
- Responsive đã kiểm tra không tràn ngang ở 390px và desktop.
- Bottom navigation cho workspace mobile.
- Hỗ trợ `prefers-reduced-motion`.
- Kết quả recruiter hiển thị theo thứ tự verdict → lý do → bằng chứng/điểm cần xác minh.

Nội dung privacy/terms là dự thảo có cấu trúc; cần doanh nghiệp hoặc luật sư phê duyệt trước production.

## Chạy và deploy

Không dùng `npm install` hoặc `npm run build`.

Serve local tại origin được backend CORS cho phép:

```powershell
cd Software/Web/FE
python -m http.server 5173
```

Cloudflare Pages phục vụ trực tiếp thư mục gốc, không cần bước build. Khi không có `404.html`, Pages tự fallback route SPA về `index.html`.

## Checklist khi thay đổi

1. Đối chiếu endpoint với backend route/OpenAPI.
2. Cập nhật page template/content và router nếu route thay đổi.
3. Kiểm tra desktop/mobile, keyboard, loading, empty, error và degraded state.
4. Kiểm tra flow analysis bằng API contract hoặc mock contract.
5. Cập nhật file này, `08-cai-dat-trien-khai-kiem-thu.md` và `11-MA-TRAN-TRUY-VET.md` nếu kiến trúc/cách chạy thay đổi.
