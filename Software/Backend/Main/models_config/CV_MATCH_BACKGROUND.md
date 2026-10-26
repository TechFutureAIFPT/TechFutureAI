# Chạy nền CV Match trên Windows

## Đã cấu hình trên máy hiện tại

- Ollama chạy ẩn ở `127.0.0.1:11434`, dùng profile `cv-match:7b`, ngữ cảnh 8192. Không mở cổng ra mạng LAN.
- Windows tự chạy bộ giám sát sau khi tài khoản hiện tại đăng nhập. Có thể đóng terminal/Codex; launcher chạy qua Windows Shell.
- Bộ giám sát kiểm tra khoảng 15 giây/lần, khởi động lại Ollama nếu tiến trình dừng. Launcher khởi động lại bộ giám sát sau 15 giây nếu nó lỗi.
- Khi cắm sạc, bộ giám sát gửi yêu cầu giữ hệ thống hoạt động. Màn hình vẫn được tắt tự động theo cấu hình hiện có và có thể khóa bằng **Win + L**.
- Khi dùng pin, bộ giám sát trả quyền quản lý Sleep về Windows. Cấu hình hiện tại vẫn giữ Sleep sau 10 phút khi dùng pin.
- Profile được nạp sẵn và giữ trong bộ nhớ 24 giờ; bộ giám sát làm mới thời gian giữ mỗi 4 giờ. Backend Main đã đặt `LOCAL_CV_KEEP_ALIVE=24h`; backend đang chạy cần khởi động lại để đọc thay đổi này. Model tiếp tục chiếm RAM/VRAM khi được giữ sẵn.
- Không thay đổi hành vi gập nắp, nút nguồn hay lệnh Sleep thủ công. Hiện gập nắp laptop vẫn chuyển sang Sleep.

**Sleep/Hibernate thật sẽ dừng xử lý CPU/GPU.** Muốn model chạy liên tục, cắm sạc và dùng tắt màn hình/Win + L. Bộ giám sát không ngăn lệnh Sleep chủ động. Tắt máy, hết pin hoặc đăng xuất tài khoản cũng không duy trì được bộ chạy nền này. Chạy trước khi có người đăng nhập cần cấu hình dịch vụ Windows riêng.

Nguồn: [Microsoft về trạng thái Sleep](https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/system-sleeping-states), [giới hạn của yêu cầu giữ hệ thống hoạt động](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadexecutionstate), [Ollama keep_alive](https://docs.ollama.com/faq).

## Điều khiển

Từ `Software/Backend/Main`:

```powershell
# Trạng thái tiến trình và nguồn điện
.\scripts\manage_cv_background.ps1 -Action Status

# Tạm dừng bộ chạy nền; giải phóng yêu cầu giữ máy thức
.\scripts\manage_cv_background.ps1 -Action Stop

# Chạy lại sau khi tạm dừng
.\scripts\manage_cv_background.ps1 -Action Start

# Cài lại tự khởi động cho tài khoản Windows hiện tại
.\scripts\manage_cv_background.ps1 -Action Install -UseUserStartup

# Gỡ tự khởi động, khôi phục keep_alive trước khi cài
.\scripts\manage_cv_background.ps1 -Action Uninstall
```

Tạm dừng được giữ qua lần đăng nhập sau cho đến khi chạy lệnh Start. Khi dừng, bộ giám sát chỉ dừng daemon do chính nó khởi chạy. Nếu kết nối vào Ollama đã chạy sẵn từ trước thì daemon đó vẫn thuộc trình khởi chạy ban đầu.

Máy này dùng mục khởi động `AIMatchCVLocal` trong `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`. Task Scheduler đã được thử nhưng không khởi chạy được action trong phiên này; task thử đã được gỡ và thay bằng cơ chế khởi động theo người dùng. Không cần lưu mật khẩu Windows hoặc chạy bằng quyền Administrator.

File trạng thái và nhật ký nằm ở:

```text
%LOCALAPPDATA%\AI Match\CV Match\background.json
%LOCALAPPDATA%\AI Match\CV Match\status.json
%LOCALAPPDATA%\AI Match\CV Match\logs\
```

Nhật ký ghi sự kiện tiến trình và trạng thái dịch vụ. Bộ giám sát không ghi văn bản CV/JD. Khi gỡ, các file cấu hình và nhật ký được giữ lại để kiểm tra.

## Kiểm tra đã thực hiện

- Đọc lại mục tự khởi động Windows và xác minh launcher/supervisor chạy ẩn.
- Xác minh API Ollama phản hồi, profile CV Match được nạp, yêu cầu giữ hệ thống hoạt động được Windows chấp nhận khi cắm sạc.
- Dừng tiến trình daemon thử nghiệm và xác minh bộ giám sát tự tạo daemon mới.
- Kiểm tra thu hồi model runner cũ để tránh giữ bộ nhớ GPU sau khi daemon thoát.
- Thử Stop/Start của bộ chạy nền. Không thực hiện Sleep hay khởi động lại Windows trong lúc phiên làm việc đang mở.
