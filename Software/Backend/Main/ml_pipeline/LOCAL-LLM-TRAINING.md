# Huấn luyện LLM CV Match trên máy

Đây là cập nhật trọng số QLoRA cho LLM cùng họ với `cv-match:7b`; không phải huấn luyện lại TF-IDF/LinearSVC và không dùng API AI để sinh nhãn hoặc train. Môi trường train được tách tại `../.cache/cv-qlora-venv` để không đổi thư viện của API.

## Nguồn và giới hạn dữ liệu

- Base: [Qwen2.5-Coder-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct), revision `c03e6d358207e414f1eca0bb1891e29f1db0e242`.
- Dataset: [opensporks/resumes](https://huggingface.co/datasets/opensporks/resumes), revision `ed4cb5f3fd1ce7e0a0e74e1a09c1a3b702c2c2eb`, CC0. CSV phải khớp SHA-256 `816a7cd985a9a41e3ce8d1e83cb7e1beb1e854a89c1cf1fd0d75494faaa0559d`.
- Dữ liệu nghề nghiệp chỉ có nhãn phân loại ngành. Pipeline tạo **weak supervision** từ các đoạn CV có bằng chứng kỹ năng; không biến nhãn ngành thành điểm tuyển dụng do chuyên gia chấm.
- Bộ chuẩn bị hiện tại: 616 train / 76 validation / 76 test, từ 384 nhóm CV. Tất cả biến thể của một CV thuộc cùng một tập. Kiểm tra hash và nhóm trước khi train. Không dùng CV của người dùng trong SQL làm dữ liệu train.
- Bài học hiện chỉ gồm trích xuất bằng chứng và JSON ngắn, một tiêu chí, không có nhãn chuyên gia cho toàn CV, nhiều tiêu chí hoặc hard filter. Loss giảm không chứng minh độ chính xác tuyển dụng hoặc loại bỏ hoàn toàn overfitting/underfitting.

## Các lệnh đã kiểm chứng

Từ thư mục `ml_pipeline`:

```powershell
$env:HF_HUB_OFFLINE='1'
$env:TRANSFORMERS_OFFLINE='1'
..\.cache\cv-qlora-venv\Scripts\python.exe train_cv_local_lora.py `
  --base-model ../.cache/qwen2.5-coder-7b-instruct-hf `
  --dataset data/curated/cv-local-sft-v1 `
  --output artifacts/cv-match-lora-new-run `
  --max-steps 64 --max-length 1024 --eval-every 8 --eval-samples 24 `
  --quantize-output-head --offload-frozen-embeddings
```

Mỗi lần chạy phải có output mới. Có thể truyền `--warm-start-adapter path/to/best-adapter`; đây là khởi động từ trọng số adapter, optimizer và lịch learning rate được tạo lại, không phải resume toàn bộ trạng thái optimizer.

Huấn luyện dùng NF4, LoRA r=4/alpha=8 trên q_proj/v_proj, dropout=0.05, weight decay=0.01, clip gradient=1.0 và learning rate thấp có warmup/decay. Chọn checkpoint bằng validation; early stopping sau hai lần không cải thiện. Tập test chỉ được đánh giá sau khi chọn checkpoint. Completion loss không tính prompt và không cắt ngầm tài liệu vượt max-length. Báo cáo ghi số mẫu thực tế đã dùng; vòng 64 bước với accumulation=4 trình bày 256 lượt mẫu, không phải toàn bộ 616 mẫu.

RTX 4050 6 GB trên Windows dùng thêm RAM hệ thống ở giai đoạn nạp model. Chuyển embedding đóng băng sang CPU và giảm bộ nhớ output projection đã giúp tốc độ ổn định khoảng 12 giây/bước trên máy này. Không chạy Ollama inference đồng thời với train.

## Đóng gói và đánh giá

```powershell
..\.cache\cv-qlora-venv\Scripts\python.exe export_cv_local_lora.py `
  --base-model ../.cache/qwen2.5-coder-7b-instruct-hf `
  --adapter artifacts/cv-match-lora-local-v3/best-adapter `
  --output artifacts/cv-match-new-candidate-merged
```

Script merge từng shard trên CPU, giữ nguyên base, kiểm tra tên/shape tensor, chỉ áp dụng các delta LoRA được hỗ trợ. Ollama 0.40.4 trên máy này từ chối import Safetensors trực tiếp cho Qwen2. Vì vậy bản đã kiểm thử dùng llama.cpp `b11669` (commit `620d2225cc436ab0b001e3200e590e3b286ef9ab`) để chuyển HF → GGUF F16 rồi `llama-quantize` → Q4_K_M. Thực hiện tại `Main/.cache/llama-cpp-b11669`:

```powershell
..\cv-qlora-venv\Scripts\python.exe convert_hf_to_gguf.py `
  ../../ml_pipeline/artifacts/cv-match-7b-local-sft-v1-merged `
  --outfile ../../ml_pipeline/artifacts/cv-match-local-sft-v1-f16.gguf --outtype f16
```

Tại `ml_pipeline/artifacts`:

```powershell
..\..\.cache\llama-b11669-bin\llama-quantize.exe `
  cv-match-local-sft-v1-f16.gguf cv-match-local-sft-v1-Q4_K_M.gguf Q4_K_M 8
cd cv-match-7b-local-sft-v1-merged
ollama create cv-match:7b-local-sft-v1 -f Modelfile
```

Modelfile đã tạo trỏ tới GGUF, chứa system prompt chuyên trách CV. Đây là tên model ứng viên riêng; không ghi đè `cv-match:7b`. Công cụ được tải từ [llama.cpp chính thức](https://github.com/ggml-org/llama.cpp/releases/tag/b11669); ZIP Windows CPU có SHA-256 `37b3efcf962847ca869745fd4ccf7f5e7e8dacfeff9fa3523b4ca8cdc66d632b`. Xem [hướng dẫn import chính thức của Ollama](https://docs.ollama.com/import).

Kiểm thử model ứng viên bằng `api_server/scripts/benchmark_cv_match.py` với biến môi trường `LOCAL_CV_MODEL` trỏ tới tên ứng viên. Kiểm tra phủ định kỹ năng, prompt injection, nhồi từ khóa, chức danh không có dẫn chứng, thay đổi thông tin cá nhân, schema và tính đầy đủ của các tiêu chí. Phải đánh giá thêm tập CV/JD do chuyên gia chấm, đa ngành, nhiều mức kinh nghiệm và CV ngoài phân phối trước khi đổi model mặc định. Những kiểm thử tổng hợp này không phải thước đo độ chính xác sản xuất.

`automaticPromotionAllowed=false` được giữ trong manifest và báo cáo: không tự đổi model đang phục vụ chỉ vì training loss giảm. Tổng điểm vẫn do backend tính theo rubric sau khi kiểm tra bằng chứng, không nhận điểm tổng do LLM tự đặt.

## Curriculum bổ sung v2

Các công cụ mới dùng dữ liệu công khai ghim phiên bản và các CV tổng hợp có rubric minh bạch. Nhãn mức 0–4 trong CV tổng hợp không phải nhãn chuyên gia. Không huấn luyện trên JobResQA, CareerCorpus, các benchmark TechWolf, dữ liệu cá nhân trong SQL hoặc nguồn chưa rõ điều khoản.

```powershell
..\.cache\ml-quality-venv\Scripts\python.exe acquire_cv_curriculum_sources.py
..\.cache\ml-quality-venv\Scripts\python.exe prepare_cv_curriculum.py --output data/curated/cv-curriculum-v2-new
```

Chuẩn bị và đánh giá dùng môi trường CPU riêng với `requirements-cv-curriculum-evaluation.txt`; train/merge dùng môi trường Torch nêu trên. Công cụ không chạy mã hoặc script gọi AI cloud của các nguồn dataset.

Lệnh vòng v2 dùng `--max-steps 198 --gradient-accumulation 4 --max-length 1024 --eval-every 33 --eval-samples 0 --learning-rate 0.00003 --patience 2 --selection-task cv_evidence`, khởi động từ adapter v1. `--eval-samples 0` đánh giá đầy đủ từng split; `--selection-task` chỉ định tác vụ dùng chọn checkpoint, các tác vụ khác vẫn được ghi số đo. Mẫu vượt độ dài làm dừng preflight; không tự bỏ. Trộn lại train mỗi epoch.

`evaluate_cv_curriculum.py --freeze --output <thư mục mới>` cố định kế hoạch trước khi xem đầu ra model. Sau đó chạy `--plan <plan.jsonl> --model <tên Ollama> --output <thư mục kết quả riêng>`. Kết quả giữ raw level trước ràng buộc, điểm sau backend, schema, trích dẫn, hard filters và lỗi từng ca. `--tasks cv_evidence challenge` chỉ chạy phần nghiệp vụ; phải ghi rõ phạm vi khi so sánh với lần chạy đầy đủ. Kết quả resume phải khớp model, hash kế hoạch và danh sách tác vụ.

`package_cv_curriculum.py` chỉ nhận run đã có báo cáo training và adapter khớp hash; tạo tên ứng viên `cv-match:7b-local-sft-v2`, không đổi model mặc định. Đường dẫn đóng gói v2 cố định và phải chưa tồn tại; không chạy lại để ghi đè tệp cũ. Kiểm tra digest mọi model cũ sau import.

Chi tiết lần chạy và giới hạn đánh giá nằm trong `Artifacts/AI-Match-Local-Training-v2-2026-10-21/KE-HOACH.md` ở gốc workspace. Điểm CareerCorpus là proxy chất lượng hồ sơ, không chuyển trực tiếp thành điểm phù hợp JD; exact match/token F1 của JobResQA là chỉ số văn bản, không thay thế đánh giá chuyên gia.
