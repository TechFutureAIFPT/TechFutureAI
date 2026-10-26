# Kết quả đối chiếu Firebase và SQL local

Đợt nâng cấp đã áp dụng ngày 19/10/2026. Firestore project: `gen-lang-client-0595612537`. SQL có dữ liệu thật là `Software/Local_AI_Server/data/supporthr_local.db` (SQLite); cấu hình PostgreSQL/pgvector trong Main chưa có server chạy để đối chiếu trực tiếp.

## Đã bổ sung

| Kho dữ liệu | Kết quả |
| --- | --- |
| Firestore `cvHistory` | Bổ sung trường tương thích cho 367 document; không ghi đè trường đã tồn tại |
| Định danh người dùng | Thêm `uid` cho 292 lịch sử dựa trên Firebase Auth có email đã xác thực và tài khoản đang hoạt động |
| SQLite | Thêm 156 cột trong 25 bảng mới/cũ; thêm `assistantSessions` và `schema_migrations`, tổng cộng 34 bảng |
| Dữ liệu local | Bổ sung từ `source_payload` cho 822 dòng; đồng bộ 958 document hiện có và thêm 6 document |
| Vector | Khôi phục BLOB float32 của 115 vector từ vector nguồn; dữ liệu cloud hiện có 3072 chiều |

Các nhóm cột bổ sung gồm cấu hình `settings/version`, thông tin người tuyển dụng, metadata AI/OCR, kết quả sàng lọc, thông tin cache, trạng thái đánh chỉ mục và metadata vector. Bảng mirror có `firestoreDocumentId` để giữ định danh document nguồn.

Các trường lịch sử được bổ sung khi có dữ liệu gốc tương ứng: `email/userEmail`, `jdTitle/jobPosition`, `cvCount/totalCandidates`, `jdText`, `jdTextSnippet`, `createdAt`. Backend đã cập nhật luồng ghi mới và đọc lịch sử cũ; hỗ trợ cả tên trường điểm/xếp hạng có dấu và không dấu từ model local.

Đồng bộ SQLite dùng UPSERT thay cho REPLACE, giữ cột riêng của local và từ chối xung đột chủ sở hữu. Không suy ra `uid` bằng email hoặc giá trị `system`. Công cụ xem database che token trong cả cột trực tiếp và JSON lồng nhau.

## Kiểm chứng sau nâng cấp

- SQL không còn thiếu cột nghiệp vụ so với các trường thực tế của các collection được kiểm tra.
- `PRAGMA integrity_check = ok`; không có lỗi khóa ngoại.
- Giữ đủ khóa chính của 993 dòng cũ; các bảng cũ hiện có 998 dòng, cộng 1 hội thoại trợ lý mới và 1 phiên bản migration ở hai bảng bổ sung.
- Lịch sử local vẫn đủ 368 dòng. Số dòng có email tại cột `uid` giảm từ 303 xuống 11.
- Chạy lại công cụ backfill Firestore: `documentsToPatch = 0`. Chạy lại kế hoạch schema local: không còn thay đổi.
- Migration được thử trên bản sao database thật trước khi áp dụng vào database đang dùng.

## Dữ liệu còn cần xác minh

Còn 11 lịch sử chưa đủ căn cứ thêm `uid`: 10 bản liên quan email chưa xác thực, 1 bản không tìm thấy tài khoản Auth. Giữ nguyên các bản này; không gán sang người dùng khác. Danh sách document nằm trong báo cáo riêng tại `.cache/schema-audit/verification/`.

`userRole`, `recruiterInfo` và một số hồ sơ tùy chọn chưa được người dùng nhập đầy đủ. Đây là dữ liệu nghiệp vụ cần người dùng xác nhận, không tự điền vai trò hay thông tin doanh nghiệp giả. Collection rỗng không cần tạo document mẫu.

Ba collection ngoài phạm vi ứng dụng hiện tại (`medical_records`, `status`, `analysisFeedback.  Document ID`) được giữ nguyên. Không đọc nội dung hoặc di chuyển dữ liệu của chúng. Hai trường OAuth `accessToken/refreshToken` không được nhân bản thành cột mới; lần export phục vụ migration loại trừ các collection OAuth.

## Bản sao lưu và công cụ

Các đường dẫn dưới đây tính từ `Software/Backend/Main/api_server`:

- Firestore trước thay đổi: `.cache/schema-audit/firestore-history-before-20261018T200749Z.json` (gồm snapshot lịch sử và trạng thái đồng bộ bị tác động).
- SQLite trước thay đổi: `.cache/schema-audit/backups/sqlite-before-schema-20261018T200847900386Z.db`.
- Báo cáo cấu trúc: `.cache/schema-audit/before.json`, `after.json`.
- Báo cáo migration: `.cache/schema-audit/sqlite-applied.json`, `sqlite-verification.json`.

Snapshot/export có thể chứa hồ sơ và thông tin cá nhân; lưu trong thư mục đã loại khỏi Git. Database local, môi trường ảo và file cấu hình bí mật cũng được loại khỏi Git.

Kiểm tra lại cấu trúc, chỉ đọc:

```powershell
.\.venv\Scripts\python.exe scripts/audit_data_schema.py --expect-project gen-lang-client-0595612537 --sqlite ../../../Local_AI_Server/data/supporthr_local.db --report .cache/schema-audit/recheck.json
.\.venv\Scripts\python.exe scripts/maintain_history_schema.py --expect-project gen-lang-client-0595612537
```

CLI `Software/Local_AI_Server/scripts/migrate_data_schema.py` mặc định chỉ xem trước; `--apply` sao lưu trước khi ghi trong transaction. `--database` cho phép thử trên bản sao. Manifest cột nằm tại `app/db/schema_additions.json`.

## Bổ sung sau kiểm thử ngày 21/10/2026

Luồng đồng bộ lịch sử mới ghi thêm `createdAt`, `cvCount`, `jdTitle`, `jdText` vào `syncedAnalysisHistory`. Migration `2026-10-21-schema-v2` đã thêm 4 cột tương ứng ở SQLite, nâng tổng số cột bổ sung của hai đợt lên 160. Đã sao lưu tại `.cache/schema-audit/backups/sqlite-before-schema-20261021T034634278913Z.db`; kiểm tra toàn vẹn và giữ số dòng đều đạt. Bộ kiểm thử local có 19 ca đạt.
