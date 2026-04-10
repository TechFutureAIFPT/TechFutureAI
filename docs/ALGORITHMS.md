# 🧠 Thuật Toán & Kỹ Thuật AI

<div align="center">

[🏠 **Tổng Quan**](../README.md) | [🏗️ **Cấu Trúc & Lưu Đồ**](./ARCHITECTURE.md) | [🧠 **Thuật Toán & AI**](./ALGORITHMS.md)

</div>

---

## 1. Các Công Nghệ & API Tích Hợp (New Features)

### 👁️ Google Cloud Vision API (OCR Nâng Cao)
Hệ thống sử dụng **Google Cloud Vision API** để thay thế và bổ trợ cho Tesseract.js trong các trường hợp phức tạp:
- **Xử lý ảnh chất lượng thấp**: Khả năng nhận diện văn bản từ ảnh chụp mờ, nghiêng hoặc thiếu sáng tốt hơn 40% so với thư viện client-side.
- **Layout Analysis**: Tự động phát hiện cấu trúc văn bản (cột, bảng biểu) để trích xuất thông tin chính xác theo ngữ cảnh.
- **Handwriting Recognition**: Hỗ trợ đọc chữ viết tay trong các form điền sẵn (nếu có).

### 🌐 RapidAPI Integration (Dữ Liệu Thị Trường)
Hệ thống kết nối với **RapidAPI** (cụ thể là `job-salary-data` API) để:
- **Real-time Salary Benchmarking**: Lấy dữ liệu lương trung bình theo vị trí và địa điểm (Việt Nam & Global).
- **Market Trends**: Cập nhật xu hướng tuyển dụng để điều chỉnh trọng số đánh giá (ví dụ: kỹ năng nào đang "hot").
- **Fallback Strategy**: Nếu không có dữ liệu chính xác, hệ thống sử dụng thuật toán nội suy từ dữ liệu lịch sử đã cache.

### 📚 Wikipedia API (Domain Knowledge Enrichment)
Để AI "hiểu" sâu hơn về các ngành nghề đặc thù, hệ thống sử dụng **Wikipedia API**:
- **Keyword Extraction & Definition**: Khi gặp từ khóa lạ trong CV/JD, hệ thống tự động tra cứu định nghĩa trên Wikipedia để hiểu ngữ cảnh.
- **Skill Graph Building**: Xây dựng cây kỹ năng liên quan. Ví dụ: Nếu JD yêu cầu "React", hệ thống tra cứu Wiki để biết "Redux", "Hooks", "Virtual DOM" là các khái niệm liên quan cần tìm trong CV.

### 📐 CV Embedding & Semantic Search
Thay vì chỉ so khớp từ khóa (Keyword Matching), hệ thống sử dụng kỹ thuật **Vector Embedding**:
- **Model**: `text-embedding-004` (Google Gemini).
- **Cơ chế**: Chuyển đổi toàn bộ nội dung CV và JD thành các vector 768 chiều.
- **Semantic Matching**: Tính toán khoảng cách Cosine giữa vector CV và vector JD.
  - Giúp phát hiện ứng viên phù hợp ngay cả khi họ không dùng từ khóa chính xác (ví dụ: JD cần "Python dev", CV ghi "Django Backend Engineer" -> AI vẫn hiểu là phù hợp).
- **Clustering**: Gom nhóm các ứng viên có hồ sơ tương tự nhau để HR dễ dàng so sánh.

---

## 2. Hệ Thống Thuật Toán AI Chấm Điểm Deterministic

### Công Thức Chấm Điểm Tổng Thể
```
Điểm Cuối Cùng = Σ(trọng_số_i × điểm_thành_phần_i) - điểm_phạt
Độ Tin Cậy = min(độ_bao_phủ, chất_lượng, tín_hiệu_liên_quan)
```

### Các Tiêu Chí Chấm Điểm Chính (8 Tiêu Chí)

**🎯 Độ Phù Hợp JD (K) - 25%:**
```
điểm_K = số_kỹ_năng_trùng_khớp / max(1, tổng_kỹ_năng_yêu_cầu)
```

**💼 Kinh Nghiệm Làm Việc (E) - 20%:**
```
năm_yêu_cầu = trích_xuất_yêu_cầu_năm(JD)
nếu năm_yêu_cầu:
    điểm_E = min(năm_kinh_nghiệm / năm_yêu_cầu, 1)
ngược_lại:
    điểm_E = min(năm_kinh_nghiệm / 5, 1)
```

**🚀 Dự Án & Portfolio (P) - 15%:**
```
có_link_hợp_lệ = kiểm_tra_https(links)
có_repo = kiểm_tra_github_gitlab(links)  
có_KPI = phát_hiện_số_liệu_thành_tích(CV)

điểm_P = min(1, 0.4×có_link_hợp_lệ + 0.3×có_repo + 0.3×có_KPI)
```

**🎓 Học Vấn & Trường (U) - 10%:**
```
hệ_số_trường = đánh_giá_uy_tín_trường(danh_sách_học_vấn)
điểm_cơ_bản = phân_tích_chuyên_ngành(học_vấn, JD)

điểm_U = min(1.2, điểm_cơ_bản × (0.7 + 0.5×hệ_số_trường))
```

**🏆 Mức Độ Gần Đây (R) - 10%:**
```
nếu đang_làm_việc: điểm_R = 1
ngược_lại:
    tháng_nghỉ = tính_tháng_từ_công_việc_cuối
    nếu tháng_nghỉ < 6: điểm_R = 1
    nếu tháng_nghỉ < 12: điểm_R = 0.8
    nếu tháng_nghỉ < 24: điểm_R = 0.5
    ngược_lại: điểm_R = 0.2
```

**🛠️ Kỹ Năng Mềm (S) - 10%:**
```
từ_khóa_mềm_JD = trích_xuất_kỹ_năng_mềm(JD)
từ_khóa_mềm_CV = trích_xuất_kỹ_năng_mềm(CV)

nếu từ_khóa_mềm_JD > 0:
    điểm_S = số_trùng_khớp / từ_khóa_mềm_JD
ngược_lại:
    điểm_S = min(từ_khóa_mềm_CV / 8, 1)
```

**💎 Chất Lượng CV (Q) - 5%:**
```
điểm_Q = 0.8  # mặc định
nếu mức_nhiễu_OCR > 0.6: điểm_Q = 0.4
nếu định_dạng_không_nhất_quán: điểm_Q = min(điểm_Q, 0.6)

điểm_Q = max(0.2, min(1, điểm_Q))
```

**📈 Chứng Chỉ & Giá Trị (V) - 5%:**
```
nếu không_có_chứng_chỉ: điểm_V = 0.2
nếu có_chứng_chỉ_liên_quan(AWS, Azure, PMP, etc.): điểm_V = 1
nếu chứng_chỉ_hết_hạn: điểm_V = 0.5
ngược_lại: điểm_V = 0.2
```

### Hệ Thống Điểm Phạt

**🚫 Phạt Sao Chép (G) - λ_G = 0.15:**
```
tỷ_lệ_trùng_lặp = tính_độ_trùng_n_gram(JD, CV)

nếu tỷ_lệ_trùng_lặp >= 0.85: phạt_G = 1
nếu tỷ_lệ_trùng_lặp >= 0.70: phạt_G = 0.5
ngược_lại: phạt_G = 0
```

**❌ Phạt Nghi Ngờ (F) - λ_F = 0.10:**
```
phạt_F = 0

# Trùng lặp vai trò
nếu cùng_chức_danh >= 3_lần: phạt_F += 0.4

# Chứng chỉ thiếu thông tin
nếu chứng_chỉ_không_có_issuer: phạt_F += 0.3

# Senior với kinh nghiệm ít
nếu chức_danh_senior AND kinh_nghiệm < 3_năm: phạt_F += 0.3

phạt_F = min(1, phạt_F)
```

---

## 3. Thuật Toán JD-CV Matching Engine

### Công Thức Tổng Thể:
```
điểm_match = Σ(trọng_số_i × điểm_thành_phần_i) + điều_chỉnh

điều_chỉnh = recency_boost - seniority_penalty
```

### Các Thành Phần Chấm Điểm:

**📅 Kinh Nghiệm (30%):**
```
năm_yêu_cầu = phát_hiện_năm(JD)
năm_có = phát_hiện_năm(CV)

nếu năm_yêu_cầu:
    điểm = min(100, (năm_có / năm_yêu_cầu) × 100)
ngược_lại:
    điểm = min(100, năm_có × 8)
    
# Điều chỉnh gần đây
recency_boost = 0-10 (dựa trên domain match trong 8 dòng đầu CV)
seniority_penalty = 0-20 (chênh lệch cấp độ senior)
```

**🛠️ Kỹ Năng (30%):**
```
kỹ_năng_bắt_buộc = trích_xuất_must_have(JD)
kỹ_năng_ưu_tiên = trích_xuất_nice_to_have(JD)
kỹ_năng_CV = trích_xuất_kỹ_năng(CV)

điểm_must = số_trùng_must / tổng_must
điểm_nice = số_trùng_nice / tổng_nice

điểm_kỹ_năng = (điểm_must × 0.7 + điểm_nice × 0.3) × 100

# Áp dụng coverage gating
coverage = số_nhóm_kỹ_năng_matched / số_nhóm_yêu_cầu
điểm_cuối = điểm_kỹ_năng × coverage
```

**🎓 Học Vấn (15%):**
```
thứ_tự_bằng = ['highschool', 'associate', 'bachelor', 'master', 'phd']

bằng_yêu_cầu = phát_hiện_bằng(JD)
bằng_có = phát_hiện_bằng(CV)

nếu bằng_có == bằng_yêu_cầu: điểm = 100
nếu bằng_có > bằng_yêu_cầu: điểm = 100
ngược_lại: điểm = max(0, 100 - (chênh_lệch × 40))
```

**🌐 Ngôn Ngữ (15%):**
```
ngôn_ngữ_yêu_cầu = ['english', 'japanese', 'korean', ...]

điểm_cơ_bản = 0
cho mỗi ngôn_ngữ trong yêu_cầu:
    nếu có_trong_CV: điểm_cơ_bản += 100/số_ngôn_ngữ_yêu_cầu
    
# Điều chỉnh theo trình độ
mẫu_trình_độ = [(ielts|toeic)_số, native, advanced, intermediate, basic]
nếu tìm_thấy_mẫu: điểm_cơ_bản += 10
```

**📜 Chứng Chỉ (10%):**
```
chứng_chỉ_quan_trọng = ['aws', 'azure', 'gcp', 'pmp', 'scrum', ...]

chứng_chỉ_yêu_cầu = lọc_từ_JD(chứng_chỉ_quan_trọng)
chứng_chỉ_có = lọc_từ_CV(chứng_chỉ_quan_trọng)

điểm = (số_trùng / số_yêu_cầu) × 100
```

### Quy Tắc Loại Bỏ:
```
# Mandatory Fail: Thiếu kỹ năng bắt buộc
nếu kỹ_năng_must_miss > 0:
    trạng_thái = 'REJECT'
    điểm_match = 0
```

### Phân Loại Level:
```
nếu trạng_thái == 'REJECT': level = 'Rejected'
nếu điểm >= 85: level = 'Expert'
nếu điểm >= 70: level = 'Advanced'
nếu điểm >= 50: level = 'Intermediate'
nếu điểm >= 30: level = 'Beginner'
ngược_lại: level = 'Unqualified'
```

---

## 4. Thuật Toán Tạo Câu Hỏi Phỏng Vấn AI

### 3 Chế Độ Tạo Câu Hỏi:

**🌐 General Mode:**
```
input: {
    vị_trí, tổng_ứng_viên, ngành_nghề,
    điểm_yếu_phổ_biến[], kỹ_năng_thiếu[]
}

prompt = xây_dựng_prompt_chung(
    "Tạo 4-5 nhóm câu hỏi dựa trên điểm yếu thực tế: " +
    điểm_yếu_phổ_biến + kỹ_năng_thiếu
)
```

**👤 Specific Mode:**
```
input: {
    thông_tin_ứng_viên_cụ_thể,
    điểm_mạnh[], điểm_yếu[],
    lĩnh_vực_mạnh[], lĩnh_vực_yếu[]
}

prompt = xây_dựng_prompt_cá_nhân(
    "Tạo câu hỏi riêng biệt để:" +
    "- Xác nhận điểm mạnh: " + điểm_mạnh +
    "- Thách thức điểm yếu: " + điểm_yếu
)
```

**⚖️ Comparative Mode:**
```
input: {
    danh_sách_ứng_viên_top[],
    so_sánh_điểm_mạnh_yếu[]
}

prompt = xây_dựng_prompt_so_sánh(
    "Tạo câu hỏi để phân biệt và lựa chọn giữa:" +
    ứng_viên_profiles
)
```

### Schema Trả Về:
```typescript
interface QuestionSet {
    category: string;      // Tên danh mục
    icon: string;         // Font Awesome class
    color: string;        // Tailwind color
    questions: string[];  // 4-6 câu hỏi cụ thể
}
```

---

## 5. Tự Động Trích Xuất & Điền Tiêu Chí Lọc (Smart Auto-Fill)

### Tổng Quan
Tính năng thông minh giúp HR **tiết kiệm thời gian** bằng cách tự động phân tích Job Description và điền sẵn các tiêu chí Hard Filter. Hệ thống sử dụng AI + Logic chuyển đổi để hiểu cả tiếng Việt lẫn tiếng Anh, đồng thời tự động chuyển đổi các chuẩn ngôn ngữ (IELTS/TOEIC → CEFR).

### Cách Hoạt Động
```
1. User upload/paste JD (text hoặc image OCR)
2. AI Gemini phân tích JD với prompt chuyên biệt
3. Validation Layer kiểm tra và chuẩn hóa kết quả
4. Smart Conversion: IELTS/TOEIC → CEFR levels
5. Auto-fill vào form Hard Filters
6. Auto-tick các checkbox "Bắt buộc"
```

### Smart Language Conversion (IELTS/TOEIC → CEFR)

Hệ thống tự động chuyển đổi các chuẩn ngôn ngữ phổ biến sang CEFR:

| Chuẩn | C2 (Proficiency) | C1 (Advanced) | B2 (Upper-Intermediate) | B1 (Intermediate) |
|-------|------------------|---------------|-------------------------|-------------------|
| **IELTS** | 8.0 - 9.0 | 7.0 - 7.5 | 5.5 - 6.5 | 4.0 - 5.0 |
| **TOEIC** | 945+ | 785 - 940 | 550 - 780 | 225 - 545 |
| **Cambridge** | CPE | CAE | FCE | PET |
| **TOEFL iBT** | 110+ | 94 - 109 | 72 - 93 | 42 - 71 |

**Ví dụ thực tế:**
- JD: "Yêu cầu IELTS 6.5" → Tự động điền: `B2` vào Language field
- JD: "TOEIC 850" → Tự động điền: `C1`
- JD: "Cambridge FCE" → Tự động điền: `B2`

### Vietnamese Recognition & Mapping

Hệ thống hiểu tiếng Việt và tự động mapping:

```typescript
// Education Mapping
"Tốt nghiệp Đại học" → "Bachelor"
"Kỹ sư" → "Bachelor"
"Cao đẳng" → "Associate"
"Thạc sĩ / Thạc sỹ" → "Master"
"Tiến sĩ" → "Doctorate"

// Location Normalization
"HN" | "Ha Noi" | "Hanoi" → "Hà Nội"
"HCM" | "TP.HCM" | "Saigon" | "SG" → "Thành phố Hồ Chí Minh"
"DN" | "Da Nang" → "Đà Nẵng"

// Seniority Mapping
"Intern" | "Thực tập sinh" → "Intern"
"Junior" | "Fresher" | "Mới ra trường" → "Junior"
"Senior" | "Kinh nghiệm" → "Senior"
"Lead" | "Trưởng nhóm" → "Lead"
"Manager" | "Quản lý" → "Manager"
```

### Auto-Tick Mandatory Checkboxes

Khi phát hiện tiêu chí trong JD, hệ thống tự động tick checkbox "Bắt buộc":

```typescript
// Ví dụ code logic
const mandatoryUpdates: any = {};
if (extractedFilters.language) mandatoryUpdates.languageMandatory = true;
if (extractedFilters.location) mandatoryUpdates.locationMandatory = true;
if (extractedFilters.education) mandatoryUpdates.educationMandatory = true;
// ... 8 fields total
```

**Các field được auto-tick:**
1. ✅ Địa điểm (Location)
2. ✅ Ngôn ngữ (Language)
3. ✅ Học vấn (Education)
4. ✅ Cấp độ (Seniority)
5. ✅ Chứng chỉ (Certifications)
6. ✅ Định dạng làm việc (Work Format)
7. ✅ Loại hợp đồng (Contract Type)
8. ✅ Ngành nghề (Industry)
