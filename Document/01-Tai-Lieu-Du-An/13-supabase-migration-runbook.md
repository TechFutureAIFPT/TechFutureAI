# 13 - Runbook chuyển Firebase sang Supabase

## Trạng thái triển khai ngày 2026-07-22

Preflight đọc trực tiếp ngày 2026-07-22 ghi nhận 44 Auth users, 978 Firestore documents/21 collections, 7 RTDB chatbot sessions, 115 vector records và Storage bucket không tồn tại. Con số 979 trong baseline kế hoạch đã được thay bằng snapshot thực tế; acceptance luôn dùng snapshot cuối ngay trước cutover.

Đã triển khai trong mã nguồn:

- SQL schema, index HNSW, RLS và Supabase Realtime tại `Software/Web/BE/supabase/migrations`.
- Bộ xuất/import/đối soát idempotent được cô lập tại `Software/Web/BE/api_server/scripts/legacy_source_supabase_migration.py`; dependency của importer nằm trong `requirements-legacy-import.txt`, không vào image production.
- Backend runtime là Supabase-only; provider flags và Firebase/Firestore runtime fallback đã bị loại bỏ.
- Backend xác minh Supabase JWT qua JWKS và dùng PostgreSQL pool qua Supavisor.
- Token Google Drive được mã hóa AES-GCM; plaintext không được lưu trong JSONB.
- Android đã dùng `@supabase/supabase-js` cho Auth, PostgreSQL/RLS và Realtime; Firebase SDK đã được loại khỏi dependency runtime.

Chưa thể thực hiện từ checkout hiện tại:

- Tạo/nâng cấp Supabase production Singapore, bật PITR và cấu hình OAuth vì chưa có quyền/project credentials.
- Import 44 tài khoản và snapshot production vì chưa có Supabase `DATABASE_URL`.
- Chuyển Web FE vì `Software/Web/FE` chưa tồn tại trong checkout hiện tại. Đây là gate bắt buộc trước cutover.

## Biến môi trường

Backend chỉ nhận cấu hình Supabase:

```text
MAINTENANCE_MODE=false
```

Biến Supabase được lưu trong secret manager, không commit:

```text
SUPABASE_URL=
SUPABASE_JWT_AUDIENCE=authenticated
DATABASE_URL=
DATA_ENCRYPTION_KEY=
MIGRATION_ARCHIVE_KEY=
```

Android cần:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL=
```

Không đưa Supabase secret/service-role key vào Web hoặc Android.

## Trình tự rehearsal

1. Tạo project Singapore gói Pro, bật PITR, chọn asymmetric JWT signing key và bật email/password + Google.
2. Áp file SQL trong `Software/Web/BE/supabase/migrations`.
3. Dùng công cụ Firebase Auth migration chính thức của Supabase để xuất/import users cùng SCRYPT parameters.
4. Tạo hai khóa AES 32 byte độc lập cho archive và dữ liệu bí mật.
5. Chạy preflight và tạo archive ngoài `D:\Support HR`:

```powershell
cd "D:\Support HR\Software\Web\BE\api_server"
python -m pip install -r requirements-legacy-import.txt
python scripts/legacy_source_supabase_migration.py preflight
python scripts/legacy_source_supabase_migration.py export --output "E:\SupportHR-Migration-Backups\supporthr-rehearsal.enc"
```

6. Import, tạo vector runtime 768 chiều và đối soát:

```powershell
python scripts/legacy_source_supabase_migration.py import --archive "E:\SupportHR-Migration-Backups\supporthr-rehearsal.enc"
python scripts/legacy_source_supabase_migration.py reembed
python scripts/legacy_source_supabase_migration.py reconcile --archive "E:\SupportHR-Migration-Backups\supporthr-rehearsal.enc"
```

7. Chạy backend tests, Android typecheck/release check, Web FE build, RLS canary và Supabase Security/Performance Advisor.

## Cutover và rollback

- Đặt `MAINTENANCE_MODE=true`, dừng worker và khóa ghi trong Firebase Security Rules; chạy export/import/reconcile cuối.
- Backend/Android hiện đã là Supabase-only; chỉ phát hành khi count, checksum, owner, secret và vector gate đều đạt.
- Phát hành Web/Android và buộc người dùng đăng nhập lại một lần.
- Khóa ghi Firebase client và giữ 30 ngày.
- Trước khi Supabase nhận ghi mới, rollback kỹ thuật dùng commit runtime cũ và dữ liệu nguồn đang được giữ nguyên. Sau khi Supabase đã nhận ghi, dùng PITR; không mở ghi song song hai nguồn.

## Acceptance bắt buộc

- Snapshot mới nhất có đủ ID/checksum; không bỏ document hoặc RTDB session.
- Auth đủ user, canary password và Google đạt.
- Unresolved owner vẫn được nhập nhưng không lọt qua RLS.
- 115 legacy vector 3072 chiều còn nguyên; runtime có đủ vector 768 chiều.
- Năm exemplar thiếu contract vẫn `pending`, không tự approved.
- Không có OAuth token plaintext trong JSONB, log, response hoặc backup không mã hóa.
- Smoke test profile, history, upload, JD template, chatbot, feedback, async analysis, worker và Realtime đều đạt.
