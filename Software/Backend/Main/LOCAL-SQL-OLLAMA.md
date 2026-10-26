# Chạy Main API với SQL và Ollama trên máy

Profile này dùng cùng các route và service nghiệp vụ của Main. Cấu hình mặc định của bản cloud được giữ nguyên. SQL được dùng cho tài khoản, phiên, hồ sơ, lịch sử, thiết lập, hội thoại, Drive và metadata nghiệp vụ. Các extension vẫn là process độc lập.

## Khởi động

Trong PowerShell, tại `D:\cv match\Software\Frontend\Desktop`:

```powershell
$env:NEXT_PUBLIC_RUNTIME_MODE='local'
$env:NEXT_PUBLIC_LOCAL_API_URL='http://localhost:8010'
$env:NEXT_DIST_DIR='.next-local'
node node_modules/next/dist/bin/next build
```

Sau đó:

```powershell
& 'D:\cv match\Software\Start-AI-Match-Local.ps1'
```

Giao diện: http://localhost:3010. Main API: http://localhost:8010/docs. Database Studio: http://localhost:8088/admin/login. Dùng nhất quán hostname `localhost` để cookie đăng nhập Google hoạt động. Script mở process ẩn, giữ nguyên process đang chiếm cổng và ghi PID/log vào `Software/Backend/Main/.cache/local-runtime/`.

Chỉ chạy Main: `.venv\Scripts\python.exe run_local.py` tại `api_server`. Cài phần OCR local bằng `.venv\Scripts\python.exe -m pip install -r requirements-local.txt`. Ollama cần có `cv-match:7b`, `qwen2.5-coder:7b` và `nomic-embed-text:latest`.

SQL hiện có được tái sử dụng tại `Software/Local_AI_Server/data/supporthr_local.db`. Lần chuyển đổi đầu tạo bản sao lưu trước khi thêm các bảng tài khoản/phiên và kho document SQL. Các bảng nghiệp vụ cũ được giữ và cập nhật cùng transaction với kho document, không mất trường JSON mở rộng. Cần sao lưu cả DB và khóa `data/.local-secrets/oauth.key`; thiếu khóa sẽ không đọc được token OAuth đã mã hóa. Không đưa DB, khóa, dataset hoặc trọng số vào Git.

## Google và Drive

Tạo `api_server/.env.local-runtime` rồi khai báo **đường dẫn** tệp OAuth Web Client đã tải từ Google Cloud:

```dotenv
GOOGLE_OAUTH_CLIENT_FILE=D:/duong-dan-den-tep-oauth.json
```

Cũng có thể cấu hình `GOOGLE_OAUTH_CLIENT_ID` và `GOOGLE_OAUTH_CLIENT_SECRET` trực tiếp trong tệp môi trường riêng này. Không gửi secret vào chat. Thêm các Authorized redirect URIs của **Web application OAuth client**:

- `http://localhost:8010/api/auth/google/callback` cho đăng nhập.
- `http://localhost:3010/google-drive/callback` cho cấp quyền Drive.

Tài khoản phải được cho phép trên consent screen nếu ứng dụng Google còn ở Testing. Drive API và Gmail API phải được bật nếu dùng các quyền tương ứng. Google OAuth/Drive/Gmail vẫn cần mạng và consent của người dùng; dữ liệu nghiệp vụ và phiên được lưu trên SQL, không yêu cầu Firebase trong profile này. Tài khoản Google được gắn theo `sub` đã xác minh, không tự gắn với tài khoản mật khẩu cùng email.

Để giữ UID Firebase cũ, công cụ `api_server/scripts/migrate_google_identities_to_sql.py` đọc provider identity từ Firebase **Authentication** và xác minh email/provider trước khi tạo ánh xạ Google `sub` → UID trong SQL. Chạy không tham số để xem số lượng; `--apply` sao lưu SQL rồi thêm ánh xạ. Không dùng trường email/provider trong hồ sơ Firestore làm bằng chứng danh tính. Sau bước chuyển đổi này, đăng nhập local không gọi Firebase.

Database Studio chỉ chấp nhận Google đã xác minh với email quản trị `hoanphuc135@gmail.com`. Phiên được Main kiểm tra lại mỗi yêu cầu và có thể thu hồi. Tài khoản tự đăng ký bằng email/mật khẩu không có quyền quản trị. Có thể ghim thêm UID bằng `LOCAL_ADMIN_UID`.

## Giới hạn cần biết

- Khôi phục mật khẩu native bằng email chưa được cung cấp nếu chưa có dịch vụ gửi thư cấu hình riêng. Đăng nhập Google dùng cơ chế khôi phục của Google.
- Queue local dùng `in_process`: kết quả được lưu SQL, công việc đang chạy không tự tiếp tục sau khi process bị tắt. Cần Redis/worker riêng nếu yêu cầu phục hồi queue sau restart.
- Trợ lý nghiên cứu, Career Compass và classifier là extension độc lập ở các cổng 8080, 8001, 5000. Profile frontend local trỏ tới các cổng local và không tự chuyển sang cloud. Không coi đây là xác nhận các extension đã được chuyển sang SQL/Ollama.
- Không chạy suy luận Ollama cùng lúc với huấn luyện QLoRA trên GPU 6 GB. Dừng huấn luyện hoặc chờ hoàn tất trước khi thử chấm CV.
- Script khởi động giữ Windows thức tạm thời bằng `SetThreadExecutionState` trong thời gian Main chạy; màn hình vẫn được tắt. Khi Main dừng, yêu cầu này được gỡ. Truyền `-AllowAutoSleep` nếu không muốn giữ máy thức. Sleep/hibernate do người dùng chủ động chọn vẫn dừng tính toán.

## Kiểm thử

Main: `.venv\Scripts\python.exe -m pytest tests -q`. Database Studio: chạy lệnh tương tự tại `Software/Local_AI_Server`. Bộ test SQL dùng DB tạm và Google giả lập, không ghi dữ liệu kiểm thử lên Firebase hoặc Drive thật.

LLM huấn luyện thật nằm trong `ml_pipeline/train_cv_local_lora.py`. Dataset có checksum, nhóm CV không trùng giữa train/validation/test. Nhãn là weak supervision cho trích xuất bằng chứng/JSON; không phải điểm chuẩn do chuyên gia tuyển dụng chấm. Adapter cần được đánh giá riêng trước khi thay model đang phục vụ.
