import type { Section } from "@/lib/sales-ops-context";

export type ProductId = "platform" | "cv" | "career" | "insight" | "interview" | "salary" | "talent";

export interface ProductBrand {
  id: ProductId;
  name: string;
  slug: string;
  purpose: string;
  description: string;
  color: string;
  tint: string;
  href: string;
}

export const productBrands = {
  platform: { id: "platform", name: "AI Match", slug: "ai-match", purpose: "Nền tảng tuyển dụng & phát triển nghề nghiệp", description: "Hệ sinh thái kết nối đánh giá hồ sơ, quản lý tuyển dụng và phát triển nghề nghiệp.", color: "#085dc5", tint: "#eef4ff", href: "/" },
  cv: { id: "cv", name: "CV Match", slug: "cv-match", purpose: "Sàng lọc & chấm điểm hồ sơ", description: "Đối chiếu CV với mô tả công việc, phân tích mức độ phù hợp và so sánh ứng viên theo bộ tiêu chí của bạn.", color: "#085dc5", tint: "#eef4ff", href: "/cv-match" },
  career: { id: "career", name: "Career Match", slug: "career-match", purpose: "Định hướng nghề nghiệp", description: "Trao đổi với cố vấn AI, khám phá sở thích Holland RIASEC và tham khảo hướng phát triển phù hợp.", color: "#087f73", tint: "#edf8f4", href: "/career-compass" },
  insight: { id: "insight", name: "Insight Match", slug: "insight-match", purpose: "Trợ lý AI & nghiên cứu", description: "Hỏi đáp về tuyển dụng, phân tích yêu cầu và tổng hợp thông tin từ nhiều nguồn tham khảo.", color: "#7251b5", tint: "#f5f0fc", href: "/ai-assistant" },
  interview: { id: "interview", name: "Interview Match", slug: "interview-match", purpose: "Câu hỏi phỏng vấn", description: "Chuẩn bị câu hỏi, thiết lập tiêu chí đánh giá và tổ chức lịch phỏng vấn ứng viên.", color: "#af6710", tint: "#fff6e9", href: "/interview-questions" },
  salary: { id: "salary", name: "Salary Match", slug: "salary-match", purpose: "Tham khảo & so sánh mức lương", description: "Khám phá dải lương theo chức danh, kinh nghiệm và khu vực để tham khảo khi lập ngân sách.", color: "#087e9c", tint: "#eaf7fb", href: "/salary-benchmark" },
  talent: { id: "talent", name: "Talent Match", slug: "talent-match", purpose: "Quản lý tuyển dụng", description: "Quản lý hồ sơ, vị trí tuyển dụng, tiến trình ứng viên, liên hệ và báo cáo trong cùng không gian làm việc.", color: "#3f5eab", tint: "#eff3fc", href: "/dashboard" },
} as const satisfies Record<ProductId, ProductBrand>;

export const serviceProducts = [productBrands.cv, productBrands.career, productBrands.insight, productBrands.interview, productBrands.salary, productBrands.talent];

export const productLogoConcepts: Record<Exclude<ProductId, "platform">, string> = {
  cv: "Logo CV Match gốc được giữ nguyên.",
  career: "La bàn gấp nếp — mở hướng đi, xác định tâm điểm nghề nghiệp.",
  insight: "Lăng kính thấu hiểu — các góc nhìn hội tụ thành thông tin rõ ràng.",
  interview: "Đối thoại hai chiều — hai khung hội thoại đan nhau, thể hiện trao đổi và phản hồi.",
  salary: "Dải tăng trưởng — các bậc giá trị kết hợp dải gấp hướng lên.",
  talent: "Kết nối đội ngũ — các hình người gắn kết qua dải gấp hình M.",
};

export function getProductForSection(section?: Section): ProductBrand {
  switch (section) {
    case "match-workflow": case "quick-score": case "history": case "criteria-settings": return productBrands.cv;
    case "ai-assistant": case "chatbot": return productBrands.insight;
    case "career-compass": return productBrands.career;
    case "interview-gen": case "interview-hub": return productBrands.interview;
    case "salary-benchmark": return productBrands.salary;
    case "overview": case "candidates": case "jobs": case "pipeline": case "contact-candidates": case "reports": return productBrands.talent;
    default: return productBrands.platform;
  }
}

export function productAsset(product: ProductId, kind: "mark" | "logo" | "logo-dark" = "mark", format: "svg" | "png" = "svg") {
  const directory = product === "platform" || product === "cv" ? "/brand/ai-match-suite" : "/brand/ai-match-suite/services-v2";
  return `${directory}/${productBrands[product].slug}-${kind}.${format}`;
}
