# AI Match — Logo riêng cho các dịch vụ

Năm logo mới lấy cảm hứng từ các mặt gấp góc cạnh, khoảng âm và màu xanh cobalt–indigo của CV Match. Mỗi dịch vụ có hình dáng riêng, nhận biết được bằng đường nét và màu sắc. Logo AI Match và CV Match được giữ nguyên.

| Dịch vụ | Ý tưởng biểu tượng | Màu nhấn |
| --- | --- | --- |
| Career Match | La bàn gấp nếp, bốn hướng cùng một tâm điểm | Teal `#087f73` |
| Insight Match | Lăng kính dạng mắt, các góc nhìn hội tụ quanh tâm hình thoi | Tím `#7251b5` |
| Interview Match | Hai khung hội thoại đan nhau, có nếp gấp ở góc | Hổ phách `#af6710` |
| Salary Match | Các cột bậc thang kết hợp dải gấp hướng lên | Cyan `#087e9c` |
| Talent Match | Ba hình người nối bởi dải gấp hình M | Xanh lam `#3f5eab` |

Màu chung: cobalt `#085dc5`, nếp gấp `#353389`, indigo `#211e55`. Bản dùng trên nền tối có các mặt sáng hơn để giữ tương phản.

## Các tệp bàn giao

Mỗi dịch vụ có đủ năm biến thể, ở cả SVG và PNG:

- `*-mark`: biểu tượng trên nền sáng; PNG 1024 × 1024 px.
- `*-mark-dark`: biểu tượng dành cho nền tối; PNG 1024 × 1024 px.
- `*-mark-mono`: biểu tượng một màu indigo; PNG 1024 × 1024 px.
- `*-logo`: biểu tượng kèm tên, dùng trên nền sáng; PNG 1320 × 336 px.
- `*-logo-dark`: biểu tượng kèm tên chữ trắng, dùng trên nền tối; PNG 1320 × 336 px.

PNG logo có nền trong suốt. SVG là vector thuần, phần tên thương hiệu đã chuyển thành đường nét, không phụ thuộc font cài trên máy.

`service-brand-board.png` và `.svg` là bảng tổng hợp 1600 × 1240 px, có CV Match gốc để đối chiếu. `palette.json` lưu bảng màu. `preserved-originals.sha256.json` ghi mã kiểm tra của 14 tệp AI Match/CV Match nguyên trạng.

`ai-match-services-v2.zip` chứa toàn bộ bộ logo mới, bảng tổng hợp, tài liệu và các bản AI Match/CV Match nguyên trạng trong thư mục `unchanged-originals/`.

## Cách sử dụng

1. Giữ nguyên tỷ lệ và chừa khoảng trống tối thiểu bằng 1/4 chiều cao biểu tượng.
2. Chọn đúng biến thể nền sáng hoặc nền tối. Không thêm đổ bóng, đổi màu từng mặt hay bóp méo hình.
3. Dùng biểu tượng ở kích thước tối thiểu 24 px trên giao diện. Khi tên dịch vụ quan trọng, đặt chữ cạnh biểu tượng hoặc dùng bản `logo` rộng tối thiểu 220 px.
4. Dùng SVG trên website; dùng PNG trong tài liệu hoặc công cụ không hỗ trợ SVG. Bản một màu phù hợp bản in giới hạn màu.

## Nguồn chỉnh sửa

Hình học, đường chữ vector, bảng tổng hợp và bước xuất ảnh được dựng trong `scripts/build-service-branding.py` tại thư mục gốc Frontend Desktop. Chạy bằng Python có `fonttools`, `playwright`, một bản Chromium và font Arial Bold:

```powershell
python scripts/build-service-branding.py --browser "C:/duong-dan/chrome.exe" --font "C:/Windows/Fonts/arialbd.ttf"
```

Script chỉ ghi vào `services-v2`, kiểm tra mã SHA-256 để bảo đảm các tệp logo gốc AI Match/CV Match không thay đổi, rồi đóng gói ZIP.
