# 🏗️ Cấu Trúc Hệ Thống & Lưu Đồ Xử Lý

<div align="center">

[🏠 **Tổng Quan**](../README.md) | [🏗️ **Cấu Trúc & Lưu Đồ**](./ARCHITECTURE.md) | [🧠 **Thuật Toán & AI**](./ALGORITHMS.md)

</div>

---

## 1. Sơ Đồ Tổng Thể Hệ Thống (System Architecture)

```mermaid
graph TD
    User[👤 Người Dùng HR] --> Auth[🔐 Xác Thực (Firebase Auth)]
    Auth --> Dashboard[🖥️ Dashboard UI]
    
    subgraph "Frontend Layer (React + Vite)"
        Dashboard --> Upload[📁 Upload Module]
        Dashboard --> Config[⚙️ Config Module]
        Dashboard --> Analysis[📊 Analysis Module]
    end

    subgraph "Processing Layer"
        Upload --> Parser[🔍 File Parsers]
        Parser --> |PDF/Word| TextExtract[Trích Xuất Text]
        Parser --> |Image| OCR[🤖 Google Vision API / Tesseract]
        
        TextExtract & OCR --> AI_Engine[🧠 AI Engine (Gemini 1.5)]
        AI_Engine --> Embedding[📐 Vector Embedding (text-embedding-004)]
    end

    subgraph "Data & Logic Layer"
        AI_Engine --> Scoring[⚖️ Deterministic Scoring]
        Scoring --> Matching[🎯 JD-CV Matching]
        
        Embedding --> VectorDB[🗄️ Vector Index]
        
        External[🌐 External APIs] --> |Salary| RapidAPI
        External --> |Knowledge| WikiAPI
        
        Matching --> Enrichment[✨ Data Enrichment]
        Enrichment --> Result[🏆 Kết Quả Phân Tích]
    end

    subgraph "Storage Layer (Firebase)"
        Result --> Firestore[🔥 Firestore DB]
        Result --> Storage[💾 Cloud Storage]
        Result --> LocalCache[⚡ Local Cache]
    end
```

### Chi tiết các thành phần:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │          HỆ THỐNG HỖ TRỢ TUYỂN DỤNG NHÂN SỰ            │
                  │              (HR SUPPORT SYSTEM)                       │
                  └─────────────────────┬───────────────────────────────────┘
                                      │
                  ┌───────────────────────────────────────────────────────────┐
                  │                 🔐 XÁC THỰC NGƯỜI DÙNG                   │
                  │              • Đăng nhập Gmail                          │
                  │              • Firebase Authentication                   │
                  │              • Quản lý phiên làm việc                   │
                  └─────────────────────┬─────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
  ┌──────────────┐           ┌──────────────┐            ┌──────────────┐
  │   📋 NHẬP    │           │  ⚙️ CẤU HÌNH │            │  📁 TẢI LÊN  │
  │ JOB DESCRIP  │           │   HỆ THỐNG   │            │      CV      │
  │   TION (JD)  │           │              │            │              │
  └──────┬───────┘           └──────┬───────┘            └──────┬───────┘
         │                          │                           │
         │   ┌──────────────────────┼──────────────────────────┘
         │   │                      │
         ▼   ▼                      ▼
  ┌─────────────────┐    ┌─────────────────┐         ┌─────────────────┐
  │ 🎯 XỬ LÝ & PHÂN │    │ 📊 THIẾT LẬP    │         │ 🔍 TRÍCH XUẤT   │
  │   TÍCH YÊU CẦU  │    │   TRỌNG SỐ      │         │    VĂN BẢN     │
  │                 │    │                 │         │                 │
  │ • Phân tích JD  │    │ • 8 Tiêu chí   │         │ • PDF Parser    │
  │ • Tách kỹ năng  │    │ • Điều chỉnh %  │         │ • Word Reader   │
  │ • Yêu cầu kinh  │    │ • Hard Filter   │         │ • Google Vision │
  │   nghiệm        │    │ • Soft Filter   │         │ • Excel Reader  │
  └─────────┬───────┘    └─────────┬───────┘         └─────────┬───────┘
            │                      │                           │
            └──────────────────────┼───────────────────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────────────┐
                  │       🤖 BỘ PHÂN TÍCH AI           │
                  │    (Google Gemini Integration)     │
                  │                                     │
                  │ ┌─────────────┐ ┌─────────────────┐ │
                  │ │ Phân tích   │ │ So khớp kỹ năng │ │
                  │ │ nội dung CV │ │ với yêu cầu JD  │ │
                  │ └─────────────┘ └─────────────────┘ │
                  │ ┌─────────────┐ ┌─────────────────┐ │
                  │ │ Đánh giá    │ │ Xác thực học    │ │
                  │ │ kinh nghiệm │ │ vấn & chứng chỉ │ │
                  │ └─────────────┘ └─────────────────┘ │
                  └─────────────────┬───────────────────┘
                                  │
                                  ▼
            ┌─────────────────────────────────────────────────────────┐
            │              📈 HỆ THỐNG CHẤM ĐIỂM                      │
            │           (Deterministic Scoring Engine)                │
            │                                                         │
            │  🎯 JD Fit (25%)     💼 Experience (20%)               │
            │  🏢 Projects (15%)   🎓 Education (10%)                │
            │  🏆 Recency (10%)    🛠️ Soft Skills (10%)             │
            │  💎 Quality (5%)     📜 Certificates (5%)             │
            │                                                         │
            │  ⚠️ ĐIỂM PHẠT: Gap Penalty + Format Penalty           │
            │                                                         │
            │  📊 CÔNG THỨC: Σ(trọng_số × điểm_thành_phần) - phạt   │
            └─────────────────────┬───────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────────────────┐
        │                🏆 XẾP HẠNG & LỌC ỨNG VIÊN                    │
        │                                                               │
        │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
        │  │ Xếp hạng     │  │ Lọc theo     │  │ So sánh chi tiết  │   │
        │  │ theo điểm    │  │ tiêu chí     │  │ giữa ứng viên     │   │
        │  │              │  │              │  │                   │   │
        │  │ • Grade A    │  │ • Điểm số    │  │ • Điểm mạnh/yếu   │   │
        │  │ • Grade B    │  │ • Kinh nghiệm│  │ • Khuyến nghị     │   │
        │  │ • Grade C    │  │ • Kỹ năng    │  │ • Ranking visual  │   │
        │  └──────────────┘  └──────────────┘  └───────────────────┘   │
        └─────────────────────┬─────────────────────────────────────────┘
                            │
            ┌───────────────────────────────────────────────────┐
            │                                                   │
            ▼                                                   ▼
  ┌─────────────────┐                                ┌─────────────────┐
  │  ❓ TẠO CÂU HỎI │                                │  📊 BÁO CÁO &   │
  │   PHỎNG VẤN     │                                │    THỐNG KÊ     │
  │                 │                                │                 │
  │ • General Mode  │                                │ • Dashboard     │
  │ • Specific Mode │                                │ • Export Excel  │
  │ • Compare Mode  │                                │ • Export PDF    │
  │ • AI Generated  │                                │ • Lịch sử phân  │
  └─────────┬───────┘                                │   tích          │
            │                                        └─────────┬───────┘
            │                                                  │
            └──────────────────┬───────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────────────┐
                │       💾 LƯU TRỮ & ĐỒNG BỘ         │
                │                                     │
                │ ┌─────────────┐ ┌─────────────────┐ │
                │ │ Local Cache │ │ Firebase Cloud  │ │
                │ │ (100 items) │ │ Sync            │ │
                │ │ 7 days TTL  │ │ Cross-device    │ │
                │ └─────────────┘ └─────────────────┘ │
                │                                     │
                │ 🔒 BẢO MẬT: Encryption + Access    │
                │                Control              │
                └─────────────────────────────────────┘
```

---

## 2. Luồng Xử Lý Chính (Main Processing Flow)

```
  Bước 1: Đăng nhập         Bước 2: Thiết lập        Bước 3: Upload CV
       │                         │                        │
       ▼                         ▼                        ▼
┌──────────────┐          ┌──────────────┐         ┌──────────────┐
│ 🔐 Gmail     │ ────────▶│ ⚙️ Cấu hình  │────────▶│ 📁 Tải file │
│ Authentication│          │ trọng số     │         │ CV (multi    │
│              │          │ & tiêu chí   │         │ format)      │
└──────────────┘          └──────────────┘         └──────┬───────┘
                                                         │
Bước 4: Trích xuất       Bước 5: Phân tích AI      Bước 6: Chấm điểm
       ▲                         │                        │
       ▼                         ▼                        ▼
┌──────────────┐          ┌──────────────┐         ┌──────────────┐
│ 🔍 Text      │ ◀────────│ 🤖 Google    │────────▶│ 📊 8 Tiêu    │
│ Extraction   │          │ Gemini +     │         │ chí + Phạt   │
│ (Vision API) │          │ Vision API   │         │ → Điểm cuối  │
└──────────────┘          └──────────────┘         └──────┬───────┘
                                                         │
Bước 7: Kết quả          Bước 8: Tạo câu hỏi      Bước 9: Lưu trữ
       ▲                         │                        │
       ▼                         ▼                        ▼
┌──────────────┐          ┌──────────────┐         ┌──────────────┐
│ 🏆 Ranking   │ ◀────────│ ❓ Interview │────────▶│ 💾 Cache +   │
│ & Comparison │          │ Questions    │         │ Firebase     │
│ Dashboard    │          │ Generation   │         │ Sync         │
└──────────────┘          └──────────────┘         └──────────────┘
```

---

## 3. Cấu Trúc Dự Án (Project Structure)

```
hr-support-system/
├── 📁 components/         # React Components
│   ├── 📁 layout/         # Layout components (Navbar, Sidebar, Footer)
│   ├── 📁 features/       # Feature modules (CVUpload, Analysis, etc.)
│   ├── 📁 pages/          # Page components (Dashboard, History, etc.)
│   ├── 📁 ui/             # Reusable UI components (Buttons, Cards, etc.)
│   ├── 📁 shared/         # Shared components (ChatBubble, PageTransition, etc.)
│   └── 📁 responsive/     # Responsive layout (Desktop, Tablet, Mobile)
├── 📁 data/               # Sample data & Embeddings
│   ├── 📁 it/             # IT CV samples
│   └── 📁 ...             # Other industry samples
├── 📁 tai-lieu/           # Tài liệu
│   ├── ARCHITECTURE.md    # System structure & flows
│   └── ALGORITHMS.md      # AI algorithms & techniques
├── 📁 cong-khai/          # Static assets
│   ├── 📁 pwa/            # PWA files (manifest, sw, offline)
│   ├── 📁 seo/            # SEO files (robots, sitemap)
│   └── 📁 images/         # Image assets
├── 📁 tien-ich/           # Utility scripts
│   └── embedData.ts       # Data embedding script
├── 📁 services/            # Business Logic Services
│   ├── 📁 ai-ml/              # 🤖 AI & Machine Learning
│   │   ├── geminiService.ts           # AI integration
│   │   ├── interviewQuestionService.ts # Interview questions
│   │   ├── industryDetector.ts        # Industry detection
│   │   ├── industryEmbeddingService.ts # Industry embeddings
│   │   ├── deterministicScoring.ts    # Scoring engine
│   │   ├── experienceMatch.ts         # Experience analysis
│   │   ├── matchEngine.ts             # Matching algorithms
│   │   └── requirementsExtractor.ts   # Requirements extraction
│   ├── 📁 file-processing/     # 📄 File Processing
│   │   ├── ocrService.ts              # OCR & document processing
│   │   └── googleDriveService.ts      # Google Drive integration
│   ├── 📁 salary-analysis/      # 💰 Salary Analysis
│   │   └── salaryAnalysisService.ts   # Salary data analysis
│   ├── 📁 history-cache/        # 🗄️ History & Cache
│   │   ├── historyService.ts          # Session history
│   │   ├── analysisHistory.ts         # Analysis tracking
│   │   ├── analysisCache.ts          # Analysis caching
│   │   └── cacheService.ts            # General caching
│   ├── 📁 data-sync/           # 📊 Data & Sync
│   │   ├── dataSyncService.ts         # Firebase sync
│   │   ├── userProfileService.ts      # User management
│   │   └── institutionsData.ts        # Institution data
│   └── 📁 audit/               # 🔍 Audit & Monitoring
│       ├── auditService.ts            # Audit logging
│       └── scoringWorker.ts          # Scoring background
├── 📁 src/                # Source root
│   └── firebase.ts        # Firebase config
├── 📁 types/              # TypeScript definitions
└── 🔧 Config files        # Vite, Tailwind, TypeScript, Vercel
```
