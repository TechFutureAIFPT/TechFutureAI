# 11 - Ma trận truy vết tài liệu và code

Ma trận này giúp thay đổi code kéo theo đúng tài liệu, và tài liệu dẫn người đọc tới đúng code.

| Năng lực | Tài liệu giải thích | Code anchors | Cập nhật tài liệu khi |
| --- | --- | --- | --- |
| Tổng quan sản phẩm | `01-tong-quan-du-an.md` | `Web/FE/src/app/App.tsx`, `Android/src/App.tsx` | Thêm/bỏ workflow hoặc đổi vai trò Web/Mobile |
| Kiến trúc | `02-kien-truc-he-thong.md` | `BE/api_server/app/main.py`, `FE/src/app/App.tsx`, `Android/src` | Thêm service, integration, runtime hoặc thay boundary |
| Backend | `03-backend-be-tu-a-z.md` | `BE/api_server/app/{api,services,repositories,integrations}` | Đổi cấu trúc layer hoặc trách nhiệm service |
| API | `04-api-reference.md` | `BE/api_server/app/api/routes` | Thêm, xóa, đổi path, auth hoặc schema endpoint |
| Frontend | `05-frontend-fe-tu-a-z.md` | `FE/src/{app,pages,features,services}` | Đổi route, AppStep, state hoặc API client |
| AI/ML | `06-ai-ml-pipeline.md` | `BE/api_server/app/{core,services,models}`, `BE/ml_pipeline` | Đổi model, prompt pipeline, scoring, RAG hoặc artifact |
| Auth/dữ liệu | `07-database-auth-storage.md` | `BE/api_server/app/repositories`, Firebase config | Đổi collection, ownership, auth hoặc retention |
| Firebase -> Supabase | `13-supabase-migration-runbook.md` | `BE/supabase/migrations`, `BE/api_server/scripts/firebase_supabase_migration.py`, `BE/api_server/app/integrations`, `Android/src/services` | Đổi schema, RLS, provider flag, importer, cutover hoặc rollback |
| Chạy/deploy/test | `08-cai-dat-trien-khai-kiem-thu.md` | `package.json`, `render.yaml`, `BE/api_server/Dockerfile`, `BE/docker-compose.yml`, `BE/deploy/kubernetes`, `vercel.json`, `eas.json` | Đổi lệnh, biến môi trường, platform hoặc release gate |
| Backend scale audit | `12-backend-scale-audit.md` | `BE/api_server/app`, `BE/deploy/kubernetes`, `BE/docker-compose.yml` | Đổi queue, worker, autoscaling, observability hoặc production gap |
| Demo | `09-kich-ban-thuyet-trinh-demo.md` | FE routes và dữ liệu demo đã kiểm tra | Luồng demo hoặc màn hình thay đổi |
| Phản biện | `10-cau-hoi-phan-bien.md` | Code/config chứng minh câu trả lời | Một tuyên bố kỹ thuật không còn đúng |

## Quy trình chống lệch tài liệu

1. Xác định hàng liên quan trước khi sửa code.
2. Kiểm tra code anchors thực tế, không dựa vào trí nhớ hoặc báo cáo cũ.
3. Thay đổi code và test.
4. Cập nhật tài liệu nếu hành vi, kiến trúc, contract hoặc cách vận hành đổi.
5. Trong handoff, nêu rõ code đã đổi và tài liệu nào đã đồng bộ.

Các đường dẫn trong bảng được hiểu tương đối từ `Software/`: `FE` là `Software/Web/FE`, `BE` là `Software/Web/BE`, và `Android` là `Software/Android`.
