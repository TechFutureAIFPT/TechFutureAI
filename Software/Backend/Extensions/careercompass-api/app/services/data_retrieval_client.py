import os
import re
import json
import logging
import httpx
from urllib.parse import urlencode
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings
from app.schemas.chat import CitationItem

logger = logging.getLogger("services.data_retrieval_client")

# Path to unified database in main_backend/app/data
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

def _load_json(name: str):
    p = os.path.join(DATA_DIR, name)
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

UNIVERSITIES_DATABASE = _load_json("universities_database.json")
MAJORS_DATABASE = _load_json("majors_database.json")

# Mapping phổ biến giữa tên gọi / từ khóa người dùng với mã trường chuẩn
UNI_KEYWORD_MAP = {
    "bách khoa hà nội": "BKA",
    "bách khoa": "BKA",
    "hust": "BKA",
    "bka": "BKA",
    "kinh tế quốc dân": "KHA",
    "neu": "KHA",
    "kha": "KHA",
    "ngoại thương": "FTU",
    "ftu": "FTU",
    "công nghệ đhqg": "QHI",
    "uet": "QHI",
    "qhi": "QHI",
    "đại học công nghệ": "QHI",
    "kinh tế tphcm": "DHK",
    "kinh tế tp.hcm": "DHK",
    "ueh": "DHK",
    "dhk": "DHK",
    "thương mại": "TMA",
    "tmu": "TMA",
    "tma": "TMA",
    "học viện ngoại giao": "NTH",
    "ngoại giao": "NTH",
    "dav": "NTH",
    "giao thông vận tải": "GHA",
    "utc": "GHA",
    "gha": "GHA",
    "y hà nội": "YHN",
    "yhn": "YHN",
    "hmu": "YHN",
    "xây dựng": "XDA",
    "xda": "XDA",
    "nuce": "XDA",
    "huce": "XDA",
    "bách khoa tphcm": "BKH",
    "bách khoa tp.hcm": "BKH",
    "bkh": "BKH",
    "hcmut": "BKH",
    "khoa học tự nhiên": "KTS",
    "kts": "KTS",
    "hcmus": "KTS",
    "sư phạm hà nội": "SPH",
    "sư phạm": "SPH",
    "sph": "SPH",
    "hnue": "SPH",
    "công nghệ thông tin đhqg": "QST",
    "uit": "QST",
    "qst": "QST"
}

BLOCKS = ["A00", "A01", "B00", "C00", "D01", "D07", "A02", "D08"]

class DataRetrievalClient:
    """
    Direct In-Process Data Retrieval Service (Hợp nhất 2 API thành 1).
        - Nhận diện truy vấn trường/ngành/điểm chuẩn.
        - Gọi dịch vụ tra cứu tuyển sinh được cấu hình.
        - Không tự thay dữ liệu thiếu bằng số liệu mẫu hoặc dự báo giả.
    """
    def __init__(self):
        self.base_url = settings.RETRIEVAL_SERVICE_URL.rstrip("/") if hasattr(settings, "RETRIEVAL_SERVICE_URL") else ""

    def detect_university_intent(self, message: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Phân tích câu hỏi của user để phát hiện: (Mã trường, Tổ hợp môn, Từ khóa ngành)"""
        msg_lower = message.lower()

        # 1. Phát hiện mã trường
        detected_uni: Optional[str] = None
        for kw, code in UNI_KEYWORD_MAP.items():
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, msg_lower):
                detected_uni = code
                break

        # 2. Phát hiện khối / tổ hợp
        detected_block: Optional[str] = None
        for b in BLOCKS:
            pattern = r'\b' + re.escape(b.lower()) + r'\b'
            if re.search(pattern, msg_lower) or f"khối {b.lower()}" in msg_lower or f"tổ hợp {b.lower()}" in msg_lower:
                detected_block = b
                break

        # 3. Phát hiện từ khóa ngành
        major_keywords = [
            "khoa học máy tính", "công nghệ thông tin", "kỹ thuật phần mềm",
            "kinh doanh quốc tế", "marketing", "tài chính ngân hàng", "quản trị kinh doanh",
            "trí tuệ nhân tạo", "vi mạch bán dẫn", "logistics", "y khoa", "dược học",
            "luật", "ngôn ngữ anh", "kinh tế quốc tế", "tự động hóa", "cơ điện tử"
        ]
        detected_keyword: Optional[str] = None
        for kw in major_keywords:
            if kw in msg_lower:
                detected_keyword = kw
                break

        return detected_uni, detected_block, detected_keyword

    async def get_university(self, code: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin chi tiết trường đại học in-process."""
        target_code = code.upper().strip()
        for u in UNIVERSITIES_DATABASE:
            if u.get("code") == target_code or u.get("id") == target_code:
                return u
        return None

    async def search_scores(
        self,
        university_code: Optional[str] = None,
        keyword: Optional[str] = None,
        year: Optional[int] = None,
        subject_group: Optional[str] = None,
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """Truy xuất điểm chuẩn từ dịch vụ tuyển sinh được cấu hình."""
        if self.base_url:
            params = {key: value for key, value in {
                "keyword": keyword,
                "university_code": university_code,
                "year": year,
                "subject_group": subject_group,
                "limit": min(limit, 50),
            }.items() if value is not None}
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    response = await client.get(
                        f"{self.base_url}/api/v1/retrieval/scores/search",
                        params=params,
                    )
                response.raise_for_status()
                payload = response.json()
                if payload.get("success") and isinstance(payload.get("data"), list):
                    return payload["data"][:limit]
            except (httpx.HTTPError, ValueError):
                logger.warning("Configured admission score API is unavailable.")

        return []

    async def list_universities(self, region: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lấy danh sách các trường đại học."""
        unis = UNIVERSITIES_DATABASE
        if region and region != "ALL":
            unis = [u for u in unis if u.get("region") == region or u.get("region") == "National"]
        return unis

    async def predict_cutoff_score(
        self,
        university_code: str,
        major_code: str,
        exam_block: str = "A00",
        historical_scores: Optional[List[float]] = None
    ) -> Optional[Dict[str, Any]]:
        """No unsupported forecast is returned without a validated prediction model."""
        return None

    async def get_admission_knowledge_for_query(self, user_message: str) -> Tuple[str, List[CitationItem]]:
        """
        Hàm trung tâm tích hợp vào luồng Chatbot:
        - Tự động trích xuất thông tin thực tế trực tiếp in-process
        - Trả về (context_markdown, citations) nạp vào prompt cho DeepSeek Reasoner
        """
        uni_code, block, keyword = self.detect_university_intent(user_message)
        
        admissions_triggers = [
            "trường", "đại học", "điểm chuẩn", "xét tuyển", "nguyện vọng",
            "ngành", "học phí", "chỉ tiêu", "khoa học máy tính", "kinh tế",
            "bách khoa", "ngoại thương", "quốc gia", "khối a", "khối d", "khối b"
        ]
        has_admissions_intent = (
            uni_code is not None or
            keyword is not None or
            any(t in user_message.lower() for t in admissions_triggers)
        )

        if not has_admissions_intent:
            return "", []

        citations: List[CitationItem] = []
        lines: List[str] = []

        requested_year_match = re.search(r"\b(20\d{2})\b", user_message)
        requested_year = int(requested_year_match.group(1)) if requested_year_match else 2025

        # Query the configured admissions API; do not pad its response with local demo facts.
        if uni_code:
            # Truy xuất điểm chuẩn của trường
            scores = await self.search_scores(university_code=uni_code, keyword=keyword, year=requested_year, subject_group=block, limit=8)
            if scores:
                lines.append(f"\n#### DỮ LIỆU ĐIỂM CHUẨN THAM KHẢO ({uni_code}, năm {requested_year}):")
                for s in scores:
                    groups = ", ".join(s.get("subject_groups", []))
                    lines.append(f"- Ngành: {s.get('major_name')} (Mã: {s.get('major_code')}) | Năm: {s.get('year')} | Tổ hợp: [{groups}] | Điểm được API trả về: {s.get('cutoff_score')} điểm | Nguồn ghi trong API: {s.get('source', 'không rõ')}")

                citations.append(CitationItem(
                    source_title=f"API tra cứu điểm chuẩn tham khảo - {uni_code} (chưa xác minh với trường)",
                    source_url=f"{self.base_url}/api/v1/retrieval/scores/search?{urlencode({'university_code': uni_code, 'year': requested_year})}",
                    tier="Nguồn dữ liệu bên thứ ba",
                    verified=False,
                ))

        # 2. Nếu không có trường cụ thể nhưng có từ khóa ngành
        elif keyword:
            scores = await self.search_scores(keyword=keyword, year=requested_year, subject_group=block, limit=8)
            if scores:
                lines.append(f"### DỮ LIỆU ĐIỂM CHUẨN THAM KHẢO NGÀNH '{keyword.upper()}' ({requested_year}):")
                for s in scores:
                    groups = ", ".join(s.get("subject_groups", []))
                    lines.append(f"- Trường: {s.get('uni_name', s.get('uni_code'))} | Ngành: {s.get('major_name')} | Năm: {s.get('year')} | Tổ hợp: [{groups}] | Điểm API trả về: {s.get('cutoff_score')} điểm | Nguồn ghi trong API: {s.get('source', 'không rõ')}")

                citations.append(CitationItem(
                    source_title=f"API tra cứu điểm chuẩn tham khảo - ngành {keyword.title()} (chưa xác minh với trường)",
                    source_url=f"{self.base_url}/api/v1/retrieval/scores/search?{urlencode({'keyword': keyword, 'year': requested_year})}",
                    tier="Nguồn dữ liệu bên thứ ba",
                    verified=False,
                ))

        if lines:
            context_header = (
                "\n[DỮ LIỆU THAM KHẢO TỪ API TRA CỨU BÊN THỨ BA]\n"
                "(Đây là dữ liệu lịch sử do API trả về, chưa được xác nhận trực tiếp với trường. Không gọi là dữ liệu chính thức, không dự báo năm chưa công bố và phải nêu rõ năm/nguồn):\n"
            )
            return context_header + "\n".join(lines), citations

        return "", []

# Singleton instance
retrieval_client = DataRetrievalClient()
