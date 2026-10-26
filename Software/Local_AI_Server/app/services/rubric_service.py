from typing import Any, Dict, List


RUBRIC_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "backend_developer": {
        "roleKey": "backend_developer",
        "roleLabel": "Kỹ sư Backend (Python / Java / Go / Node.js)",
        "totalWeight": 100,
        "weights": {
            "technical_skills": 45.0,
            "experience": 25.0,
            "projects": 15.0,
            "education": 10.0,
            "soft_skills": 5.0,
        },
        "description": "Ưu tiên năng lực kiến trúc hệ thống, API, database và tối ưu hiệu năng.",
    },
    "qa_engineer": {
        "roleKey": "qa_engineer",
        "roleLabel": "Kỹ sư Kiểm thử phần mềm (QA / QC / Automation)",
        "totalWeight": 100,
        "weights": {
            "technical_skills": 35.0,
            "experience": 30.0,
            "projects": 15.0,
            "education": 10.0,
            "soft_skills": 10.0,
        },
        "description": "Đánh giá khả năng thiết kế test case, automation framework và tính tỉ mỉ.",
    },
    "data_scientist": {
        "roleKey": "data_scientist",
        "roleLabel": "Chuyên viên Khoa học Dữ liệu / AI Engineer",
        "totalWeight": 100,
        "weights": {
            "technical_skills": 40.0,
            "experience": 25.0,
            "education": 15.0,
            "projects": 15.0,
            "soft_skills": 5.0,
        },
        "description": "Nhấn mạnh nền tảng toán thống kê, machine learning, deep learning và dữ liệu lớn.",
    },
    "product_manager": {
        "roleKey": "product_manager",
        "roleLabel": "Quản lý Sản phẩm (Product Manager / Product Owner)",
        "totalWeight": 100,
        "weights": {
            "experience": 35.0,
            "projects": 25.0,
            "soft_skills": 20.0,
            "technical_skills": 10.0,
            "education": 10.0,
        },
        "description": "Tập trung tư duy sản phẩm, khả năng thấu hiểu thị trường và lãnh đạo nhóm.",
    },
    "sales_executive": {
        "roleKey": "sales_executive",
        "roleLabel": "Chuyên viên Kinh doanh / Phát triển thị trường",
        "totalWeight": 100,
        "weights": {
            "experience": 40.0,
            "soft_skills": 30.0,
            "projects": 15.0,
            "education": 10.0,
            "technical_skills": 5.0,
        },
        "description": "Đánh giá thành tích bán hàng thực tế, giao tiếp và kỹ năng đàm phán chốt deal.",
    },
    "devops_engineer": {
        "roleKey": "devops_engineer",
        "roleLabel": "Kỹ sư DevOps / Hạ tầng Cloud & SRE",
        "totalWeight": 100,
        "weights": {
            "technical_skills": 45.0,
            "experience": 25.0,
            "projects": 15.0,
            "education": 10.0,
            "soft_skills": 5.0,
        },
        "description": "Ưu tiên kinh nghiệm CI/CD, Kubernetes, Docker, AWS/GCP và quản lý hạ tầng.",
    },
    "hr_generalist": {
        "roleKey": "hr_generalist",
        "roleLabel": "Chuyên viên Nhân sự tổng hợp / Tuyển dụng",
        "totalWeight": 100,
        "weights": {
            "experience": 35.0,
            "soft_skills": 25.0,
            "technical_skills": 15.0,
            "education": 15.0,
            "projects": 10.0,
        },
        "description": "Đánh giá am hiểu luật lao động, C&B, tạo nguồn ứng viên và văn hóa doanh nghiệp.",
    },
    "generic": {
        "roleKey": "generic",
        "roleLabel": "Tiêu chuẩn tổng quát (Chung cho các ngành nghề)",
        "totalWeight": 100,
        "weights": {
            "technical_skills": 35.0,
            "experience": 30.0,
            "education": 15.0,
            "projects": 10.0,
            "soft_skills": 10.0,
        },
        "description": "Bảng trọng số cân bằng tiêu chuẩn cho vị trí đa ngành.",
    },
}


def list_rubrics(version: str = "v2") -> List[Dict[str, Any]]:
    return list(RUBRIC_TEMPLATES.values())


def build_default_rubric(role_key: str, version: str = "v2") -> Dict[str, Any]:
    norm_key = (role_key or "").strip().lower()
    return RUBRIC_TEMPLATES.get(norm_key, RUBRIC_TEMPLATES["generic"])
