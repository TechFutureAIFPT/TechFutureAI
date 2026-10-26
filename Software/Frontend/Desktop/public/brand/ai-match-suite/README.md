# AI Match — Bộ nhận diện thương hiệu

**Bản cập nhật:** Năm dịch vụ Career Match, Insight Match, Interview Match, Salary Match và Talent Match dùng bộ logo riêng trong [`services-v2`](services-v2/README.md). Logo AI Match và CV Match được giữ nguyên. Các tệp ở thư mục hiện tại và mô tả dưới đây lưu bộ nhận diện trước đó; giao diện hiện dùng bảng tổng hợp và gói tải xuống trong `services-v2`.

AI Match là thương hiệu nền tảng. CV Match là dịch vụ sàng lọc và chấm điểm hồ sơ, không phải tên của toàn bộ website.

| Thương hiệu | Vai trò |
| --- | --- |
| AI Match | Website, tài khoản và toàn bộ hệ sinh thái |
| CV Match | Sàng lọc và chấm điểm hồ sơ |
| Career Match | Cố vấn AI, khảo sát sở thích và định hướng nghề nghiệp |
| Insight Match | Trợ lý AI tuyển dụng và nghiên cứu thông tin |
| Interview Match | Câu hỏi, tiêu chí và lịch phỏng vấn |
| Salary Match | Tham khảo và so sánh mức lương |
| Talent Match | Hồ sơ, vị trí, tiến trình tuyển dụng, liên hệ và báo cáo |

## Cấu trúc logo

Bộ logo kế thừa cấu trúc khối gấp của logo gốc `cvmatch-icon.png`. Các mặt khối dùng chung xanh cobalt #085dc5, xanh tím #353389 và indigo #211e55. Biểu tượng phụ và màu nhấn phân biệt từng dịch vụ. Logo nền tảng không gắn biểu tượng phụ.

- CV Match: hồ sơ; xanh cobalt.
- Career Match: la bàn; xanh teal.
- Insight Match: hội thoại và gợi mở; tím.
- Interview Match: hai khung hội thoại; vàng hổ phách.
- Salary Match: biểu đồ cột; xanh cyan.
- Talent Match: nhóm người; xanh lam.

## Tệp bàn giao

Mỗi thương hiệu có các tệp sau ở cả định dạng SVG và PNG:

- `*-mark`: biểu tượng vuông, PNG 512 × 512 px, nền trong suốt.
- `*-logo`: logo và tên thương hiệu, dành cho nền sáng; PNG rộng 1320 px.
- `*-logo-dark`: chữ trắng dành cho nền tối; PNG nền trong suốt.

`brand-board.svg` và `brand-board.png` là bảng tổng hợp bản vector đang dùng trên website.
`concept-board.png` là bản nghiên cứu hình ảnh tạo bằng công cụ image_gen, không phải nguồn dựng các SVG.
`reference-original-logo.png` là bản sao nguyên trạng logo gốc.
`palette.json` ghi màu chung và màu nhấn.
`DESIGN-BRIEF.md` lưu yêu cầu thiết kế và prompt hình ảnh.

## Sử dụng

Giữ tỷ lệ; không bóp méo, xoay, đổi màu các mặt khối hay thêm hiệu ứng. Chừa khoảng trống tối thiểu bằng 1/4 chiều cao logo. Chọn bản chữ trắng cho nền tối; bản này dùng các mặt khối sáng hơn để giữ độ tương phản. Khi hiển thị nhỏ, dùng biểu tượng kèm tên dịch vụ dạng chữ trên giao diện để bảo đảm dễ đọc.
