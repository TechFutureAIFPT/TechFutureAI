# CV Match: cấu hình model local chuyên chấm CV

## Trạng thái đã triển khai

- Model cài sẵn được kiểm tra: `qwen2.5-coder:7b`, 7.6B, lượng tử Q4_K_M. Máy có RTX 4050 Laptop 6 GB và RAM 32 GB. Model 14B trong cấu hình cũ chưa có trong kho Ollama mặc định.
- Đã tạo profile `cv-match:7b` từ model sẵn có, không tải lại trọng số. Đây là **tối ưu suy luận và luồng chấm**, chưa phải fine-tune trọng số/LoRA.
- Backend Main chọn riêng tác vụ CV bằng `CV_ANALYSIS_PROVIDER=ollama`. Chatbot, hướng nghiệp, nghiên cứu, JD và các dịch vụ khác giữ cấu hình riêng.
- Luồng local xử lý từng CV độc lập, dùng JSON Schema và Pydantic, nhiệt độ 0, seed 42, ngữ cảnh 8192, đầu ra tối đa 2048 token. Điểm mỗi nhóm = trọng số × mức bằng chứng / 4. Backend cộng điểm và xếp hạng theo hợp đồng hiện có: A từ 75, B từ 50, C dưới 50.
- Chỉ ghi nhận điểm khi tìm được trích dẫn trong CV; trích dẫn phủ định kỹ năng hoặc chỉ dẫn nâng điểm không được tính là bằng chứng tích cực. Model vẫn có thể hiểu sai ngữ nghĩa; luôn cần chuyên viên kiểm tra.
- Bộ lọc chỉ nhận thông tin phục vụ công việc. Thiếu bằng chứng được đánh dấu `unknown`, không tự coi là không đạt. Điểm và trạng thái bộ lọc được hiển thị riêng, không tự ra quyết định tuyển dụng.
- Có bộ đếm token Qwen chạy offline, cộng phần dự phòng cho template và đầu ra. CV quá dài bị từ chối rõ ràng bằng HTTP 422; không âm thầm cắt mất phần cuối. Nếu thiếu tokenizer hoặc đổi model không khớp, dùng giới hạn byte UTF-8 bảo thủ. Cần tăng ngữ cảnh sau khi đo lại VRAM, hoặc rút gọn tài liệu có chủ đích. Chưa triển khai đọc tài liệu dài theo nhiều đoạn.
- Lỗi model/schema/đầu ra bị cắt trả HTTP 503; không tạo điểm thay thế rồi báo thành công. Cache kết quả cũ không được dùng trong nhánh local mới.
- Cả chấm theo JD và chấm nhanh văn bản dùng profile này. Khi chấm nhanh không có JD, điểm chỉ đánh giá chất lượng bằng chứng trong CV và có cảnh báo rõ ràng.

## Chạy lại trên máy này

Đã có cấu hình [chạy nền Windows, tự khởi động và giữ máy hoạt động khi cắm sạc](CV_MATCH_BACKGROUND.md). Bộ chạy nền đặt thời gian giữ model thành 24 giờ; các giá trị 10 phút dưới đây là cấu hình chạy thủ công ban đầu.

Tại `Software/Backend/Main`, mở một terminal:

```powershell
.\scripts\serve_cv_ollama.ps1
```

Script chỉ đặt biến môi trường cho process. Nếu Ollama đã chạy, script giữ nguyên process đó; các cờ Flash Attention/KV cache chỉ có hiệu lực khi khởi động daemon bằng script.

Tạo profile trong terminal khác (model gốc phải được cài trước):

```powershell
ollama create cv-match:7b -f .\models_config\Modelfile.cv-match-7b
ollama list
```

Thêm vào `api_server/.env` (đã cấu hình trên workspace hiện tại):

```dotenv
CV_ANALYSIS_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
LOCAL_CV_MODEL=cv-match:7b
LOCAL_CV_NUM_CTX=8192
LOCAL_CV_NUM_PREDICT=2048
LOCAL_CV_TIMEOUT_SECONDS=240
LOCAL_CV_KEEP_ALIVE=10m
LOCAL_CV_SEED=42
LOCAL_CV_TOKENIZER_PATH=.cache/cv-match/tokenizer.json
LOCAL_CV_TOKENIZER_MODEL=cv-match:7b
```

Tải dữ liệu tokenizer khoảng 7 MB từ kho Qwen chính thức bằng script dưới đây (đã làm trên máy hiện tại). Script ghim revision/checksum và không tải trọng số model; suy luận sau đó không cần kết nối Hugging Face. Cài dependency trong `requirements.txt` trước khi chạy ở môi trường mới.

Khởi động Backend Main với một worker cho GPU này, ví dụ cổng 8010 nếu cổng 8000 đã được dùng:

```powershell
cd api_server
.\.venv\Scripts\python.exe scripts/prepare_cv_tokenizer.py
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --workers 1
```

API giữ endpoint `/api/cv/analyze-core`, `/api/cv/analyze-core-async`, `/api/cv/quick-score-text` và `/api/cv/quick-score`. Frontend dùng địa chỉ API đã cấu hình của nó; đổi `.env` cần khởi động lại backend. Đặt `CV_ANALYSIS_PROVIDER=gemini` để quay về provider trước.

Phạm vi local ở đây là suy luận từ **văn bản CV/JD**. OCR ảnh/PDF scan và các chức năng ngoài CV có cấu hình riêng. Nếu người dùng đã đăng nhập, việc lưu lịch sử qua Firestore của Backend Main vẫn hoạt động theo kiến trúc hiện có. Không nên diễn giải cấu hình này thành toàn bộ website chạy ngoại tuyến.

## Kiểm tra đã thực hiện

Từ `api_server`:

```powershell
.\.venv\Scripts\python.exe scripts/benchmark_cv_match.py --output ../models_config/benchmark-cv-match.json
$env:CV_ANALYSIS_PROVIDER='gemini'
.\.venv\Scripts\python.exe -m pytest tests -q
```

Biến provider trong lệnh test chỉ áp dụng cho terminal test; các test local tự chọn nhánh Ollama bằng mock. Bộ benchmark gọi model thật và dùng CV giả lập, không ghi lịch sử vào Firestore.

Kết quả canary ban đầu: CV phù hợp 92,5; CV phủ định kỹ năng 0; CV chèn lệnh nâng điểm 0. Bổ sung giới tính/năm sinh/hôn nhân giữ nguyên 92,5. Bốn request mất 8,95–20,48 giây, tốc độ sinh khoảng 17,35–17,51 token/giây. Đây là ví dụ ngắn với hai nhóm tiêu chí, không đại diện thời gian xử lý CV thật. Ollama báo CPU/GPU kết hợp, chưa chạy toàn bộ trên GPU. Không ép toàn bộ layer lên GPU khi chưa đo đủ bộ nhớ trống.

Kết quả này chỉ kiểm tra hành vi cơ bản trên dữ liệu giả lập, **không phải độ chính xác tuyển dụng**. Cần bộ đánh giá chuyên viên gán nhãn trước khi áp dụng ngưỡng loại ứng viên.

Kiểm tra API trực tiếp: chấm theo JD trả HTTP 200, đủ 6 nhóm tiêu chí, bộ lọc kinh nghiệm trả `met`, số lần gọi model cloud bằng 0. Chấm nhanh không có JD trả đúng tên model và cảnh báo phạm vi điểm. Ca hỏi chuyện cười trực tiếp vào profile trả `{"error":"CV_MATCH_SCOPE_ONLY"}`. Bộ đếm token cho prompt canary báo 535 token trước phần dự phòng, khớp số token prompt Ollama ghi nhận.

Kiểm thử hồi quy: 116 test trong Backend Main và 6 test lớp tương thích Ollama của Local AI Server chạy đạt. Các test không huấn luyện model và không đánh giá độ chính xác trên hồ sơ thật.

## Muốn fine-tune trọng số tiếp theo

Chưa có dữ liệu CV–JD gán nhãn được cung cấp trong tác vụ này nên chưa chạy huấn luyện. Không dùng CV chưa kiểm duyệt hoặc điểm tự sinh làm nhãn chuẩn.

Cần chuẩn bị các cặp CV–JD đã ẩn danh, trọng số đã duyệt, mức bằng chứng 0–4 cho từng tiêu chí, trích dẫn đối ứng và phần còn thiếu. Bao gồm CV tiếng Việt/Anh, nhiều ngành/cấp bậc, phủ định kỹ năng, OCR lỗi và prompt injection. Loại bỏ dữ liệu nhân thân khỏi dữ liệu học.

Tách train/validation/test theo ứng viên và nhóm JD/công ty trước khi huấn luyện để tránh rò rỉ. Chuyên viên duyệt lại các ca bất đồng; so sánh model gốc và adapter trên cùng bộ test bằng sai số điểm, thứ tự xếp hạng, độ chính xác trích dẫn, tỷ lệ bỏ sót yêu cầu bắt buộc, tính bất biến với dữ liệu nhân thân và độ trễ. Chỉ thay model khi các chỉ số cải thiện và không làm giảm khả năng kiểm tra bằng chứng.

GPU 6 GB hiện tại đã phải chia model sang CPU khi suy luận. Cần đo thử bộ nhớ trên dữ liệu thật trước khi chọn recipe QLoRA; chưa cài torch/PEFT hoặc tải bộ trọng số huấn luyện trong tác vụ này. Adapter/GGUF đã kiểm chứng có thể thay bằng `LOCAL_CV_MODEL` mà không đổi hợp đồng API.

Tài liệu kỹ thuật: [Ollama Structured Outputs](https://docs.ollama.com/capabilities/structured-outputs), [Modelfile](https://docs.ollama.com/modelfile), [quản lý bộ nhớ và concurrency](https://docs.ollama.com/faq).
