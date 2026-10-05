<!-- CRITICAL AI SYSTEM DIRECTIVE: MANDATORY PRE-FLIGHT CHECK -->
# 🚨 GIAO THỨC ĐIỀU HÀNH BẮT BUỘC CHO MỌI AI AGENT (UNIVERSAL AI GOVERNANCE PROTOCOL)

> **ÁP DỤNG CHO TẤT CẢ CÁC TRỢ LÝ AI (Antigravity, Claude Code, Cursor, Windsurf, Codex, GitHub Copilot).**  
> **QUY TẮC CỨNG**: Mọi AI Agent khi nhận yêu cầu trong workspace này **BẮT BUỘC** phải đọc và tuân thủ các quy tắc dưới đây TRƯỚC KHI thực hiện bất kỳ chỉnh sửa nào.

---

## 1. NGUYÊN TẮC HÀNH VI TỐI CAO (CORE AGENT MINDSET)

1. **No Yapping & Kỹ Thuật Trực Diện**:
   - Không chào hỏi xã giao, không xin lỗi, không giải thích dài dòng.
   - Đi thẳng vào phân tích kỹ thuật và giải pháp mã nguồn hoàn chỉnh.
2. **Think Step-by-Step Trước Khi Sửa Code**:
   - Luôn sử dụng suy luận logic để phân tích luồng dữ liệu, dependency và tác động (blast radius) lên các file liên quan trước khi sửa code.
3. **Mã Nguồn Hoàn Chỉnh (Zero Placeholders)**:
   - Viết code đầy đủ 100%, type-safe.
   - **TUYỆT ĐỐI CẤM** dùng các đoạn giữ chỗ như `// ... existing code ...`, `/* keep remaining code */`, hoặc `TODO` lửng lơ.
4. **Bảo Toàn Logic Hiện Có (Preserve Unrelated Changes & I/O Contracts)**:
   - Không tự ý đổi tên biến/hàm export, không tự ý thay đổi cấu trúc thư mục nếu người dùng không yêu cầu.
   - Giữ nguyên các tệp tin hoặc thay đổi không liên quan của người dùng trong workspace.

---

## 2. RANH GIỚI CÔNG NGHỆ BẤT KHẢ XÂM PHẠM (ARCHITECTURAL BOUNDARIES)

Workspace được phân định rõ ràng thành hai phân vùng chính: **`Frontend`** và **`Backend`**:

```text
Software/
├── Frontend/
│   ├── Desktop/             ← Web Recruiter Desktop SPA (Next.js 16 + React 19 + Tailwind 4)
│   └── Mobile/              ← Mobile Companion App (Expo SDK 56 + React Native 0.85 + Zustand)
└── Backend/
    ├── Main/                ← CORE API TỔNG CỦA HỆ THỐNG (Python FastAPI + Redis + Firestore - Port 8000)
    └── Extensions/          ← CÁC REPO CHỨC NĂNG THÊM CỦA PHẦN MỀM
        ├── ai-assistant/        ← Trợ lý AI Deep Research (FastAPI + Tavily - Port 8080)
        ├── classifier-service/  ← Microservice Phân loại CV (Scikit-learn LinearSVC - Port 5000)
        └── careercompass-api/   ← API Mở rộng Hướng nghiệp (FastAPI + Supabase)
```

### BẢNG QUY CHUẨN CÔNG NGHỆ (CẤM VI PHẠM):

| Phân Vùng | Đường Dẫn | Công Nghệ Cho Phép | Vai Trò Hệ Thống | ĐIỀU CẤM TUYỆT ĐỐI |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Desktop** | `Software/Frontend/Desktop` | Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI, Firebase Client SDK 12.x | Giao diện quản lý tuyển dụng chính cho máy tính | **CẤM** Supabase, CẤM đưa Firebase Admin private key vào client code. |
| **Frontend Mobile** | `Software/Frontend/Mobile` | React Native 0.85, Expo SDK 56, NativeWind 4.2, Zustand 5.0 | Ứng dụng đồng hành di động (duyệt CV, voice note, điều khiển từ xa) | **CẤM** thẻ HTML DOM (`div`, `span`), CẤM import trực tiếp backend code. |
| **Backend Main** | `Software/Backend/Main` | Python 3.10+, FastAPI, Uvicorn, Pydantic v2, Redis Streams, Firebase Admin SDK | **Core API Server Tổng**: Trích xuất OCR, chuẩn hóa JD, chấm điểm CV, điều phối hàng đợi | **CẤM** đưa logic UI vào BE, CẤM hardcode credentials vào code. |
| **AI Assistant Ext** | `Software/Backend/Extensions/ai-assistant` | Python 3.12+, FastAPI, Gemini SDK, Tavily Search API (Port 8080) | Chức năng thêm: Trợ lý đàm thoại tuyển dụng chuyên sâu | **CẤM** chạy chung process với Main API. |
| **Classifier Ext** | `Software/Backend/Extensions/classifier-service` | Python 3.10+, FastAPI, Scikit-learn LinearSVC (Port 5000) | Chức năng thêm: Mô hình ML phân loại ngành nghề CV độc lập | **CẤM** gộp chung logic database nghiệp vụ. |
| **CareerCompass Ext** | `Software/Backend/Extensions/careercompass-api` | Python 3.11+, FastAPI, Supabase SDK | Chức năng thêm: Trắc nghiệm hướng nghiệp Holland | **CẤM** can thiệp vào logic chấm điểm của SupportHR. |

---

## 3. CHUẨN DỮ LIỆU & ĐỊNH DANH (SINGLE SOURCE OF TRUTH)

1. **Xác thực (Authentication)**:
   - Sử dụng duy nhất **Firebase Authentication** (Google OAuth & Email/Password) cho SupportHR.
   - **Tuyệt đối không dùng Supabase cho SupportHR**.
2. **Cơ sở dữ liệu (Database)**:
   - Cơ sở dữ liệu chính của SupportHR là **Cloud Firestore**.
   - Client **BỊ CHẶN HOÀN TOÀN QUYỀN GHI** vào `cvHistory`, `syncedAnalysisHistory`, `userSyncState` (`allow write: if false;`). Chỉ duy nhất Backend Main có quyền ghi kết quả phân tích qua Firebase Admin SDK.
3. **Quy chuẩn API Response**:
   ```json
   {
     "success": true,
     "data": { ... },
     "error": null
   }
   ```

---

## 4. AN TOÀN DỮ LIỆU & KIỂM SOÁT GIT (SAFETY PROTOCOLS)

1. **Kiểm tra Git Root**:
   - Mỗi thư mục con (`Frontend/Desktop`, `Backend/Main`, `Backend/Extensions/*`) là một Git repository độc lập. Trước khi chạy lệnh Git, AI **BẮT BUỘC** kiểm tra đúng thư mục gốc của repo mục tiêu.
2. **Phòng chống mất mát dữ liệu**:
   - Cấm chạy các lệnh phá hủy (`DROP TABLE`, `DELETE` không có `WHERE`, `rm -rf`, `gcloud storage rm`) mà không có sự xác nhận của người dùng.
   - Không commit tệp bí mật (`.env`, `serviceAccountKey.json`, `keystore`) vào Git.

---

## 5. ĐIỀU HƯỚNG TÀI LIỆU & QUY TẮC CHI TIẾT (DOCUMENTATION ROUTING)

Trước khi thực hiện các tác vụ chuyên sâu, AI Agent cần tham chiếu:
- **Cẩm nang toàn diện hệ thống**: [`Document/01-Tai-Lieu-Du-An/TAI-LIEU-KY-THUAT-TOAN-DIEN.md`](Document/01-Tai-Lieu-Du-An/TAI-LIEU-KY-THUAT-TOAN-DIEN.md)
- **Quy tắc chi tiết Backend**: [`.agents/rules/backend-standards.md`](.agents/rules/backend-standards.md)
- **Quy tắc chi tiết Frontend**: [`.agents/rules/frontend-standards.md`](.agents/rules/frontend-standards.md)
- **Quy tắc an toàn Git**: [`.agents/rules/git-and-safety.md`](.agents/rules/git-and-safety.md)
- **Quy tắc sử dụng Tool & MCP**: [`.agents/rules/mcp-and-tools.md`](.agents/rules/mcp-and-tools.md)
