# SupportHR - Bộ tài liệu kỹ thuật và thuyết trình

Tài liệu được thiết kế theo kiểu “đọc theo nhu cầu”: mỗi file giải thích một phần và dẫn ngược về code hiện tại.

## Điểm bắt đầu

1. [`00-BAN-DO-DU-AN.md`](00-BAN-DO-DU-AN.md) - phạm vi sản phẩm, stack và code anchors đã xác minh.
2. [`01-tong-quan-du-an.md`](01-tong-quan-du-an.md) - bài toán và chức năng sản phẩm.
3. [`02-kien-truc-he-thong.md`](02-kien-truc-he-thong.md) - kiến trúc FE/BE/AI/Supabase/mobile.
4. [`03-backend-be-tu-a-z.md`](03-backend-be-tu-a-z.md) - Backend chi tiết.
5. [`04-api-reference.md`](04-api-reference.md) - API phục vụ demo và giải thích.
6. [`05-frontend-fe-tu-a-z.md`](05-frontend-fe-tu-a-z.md) - workflow, route và service FE.
7. [`06-ai-ml-pipeline.md`](06-ai-ml-pipeline.md) - OCR, Gemini, classifier, RAG và scoring.
8. [`07-database-auth-storage.md`](07-database-auth-storage.md) - Supabase Auth, PostgreSQL và lưu trữ.
9. [`08-cai-dat-trien-khai-kiem-thu.md`](08-cai-dat-trien-khai-kiem-thu.md) - chạy local, deploy và test.
10. [`09-kich-ban-thuyet-trinh-demo.md`](09-kich-ban-thuyet-trinh-demo.md) - kịch bản thuyết trình.
11. [`10-cau-hoi-phan-bien.md`](10-cau-hoi-phan-bien.md) - câu hỏi phản biện.
12. [`11-MA-TRAN-TRUY-VET.md`](11-MA-TRAN-TRUY-VET.md) - tính năng ↔ tài liệu ↔ code cần đồng bộ.
13. [`12-backend-scale-audit.md`](12-backend-scale-audit.md) - kiểm kê backend, ma trận thiếu và lộ trình scale Docker/Kubernetes.
14. [`13-supabase-migration-runbook.md`](13-supabase-migration-runbook.md) - schema, migration, rehearsal, cutover và rollback Supabase sang Supabase.

## Quy tắc sử dụng

- Code/config đang chạy là nguồn sự thật kỹ thuật.
- Tài liệu giải thích ý nghĩa và bối cảnh; không sao chép nguyên khối code vào tài liệu.
- Khi API, workflow, route, dữ liệu hoặc triển khai đổi, cập nhật tài liệu được chỉ ra trong ma trận truy vết.
- Các báo cáo Word/PDF ở thư mục bên cạnh là hồ sơ dự thi, không phải tài liệu kỹ thuật luôn cập nhật.
