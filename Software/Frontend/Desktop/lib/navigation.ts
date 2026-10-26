import { BarChart3, Bot, BriefcaseBusiness, CalendarDays, ClipboardCheck, Compass, Files, GitBranch, History, LayoutDashboard, Mail, Settings2, SlidersHorizontal, Users, Wallet, type LucideIcon } from "lucide-react";
import type { Section } from "@/lib/sales-ops-context";

export interface NavigationItem { id: Section; label: string; description: string; href: string; icon: LucideIcon }

export const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  { label: "Không gian làm việc", items: [
    { id: "overview", label: "Tổng quan", description: "Theo dõi hồ sơ, vị trí và hoạt động tuyển dụng.", href: "/dashboard", icon: LayoutDashboard },
  ] },
  { label: "Quản lý tuyển dụng", items: [
    { id: "match-workflow", label: "CV Match", description: "Đối chiếu hồ sơ với yêu cầu công việc theo tiêu chí của bạn.", href: "/cv-match", icon: Files },
    { id: "candidates", label: "Hồ sơ ứng viên", description: "Quản lý hồ sơ, năng lực và kết quả đánh giá ứng viên.", href: "/dashboard?section=candidates", icon: Users },
    { id: "jobs", label: "Vị trí tuyển dụng", description: "Quản lý mô tả công việc, yêu cầu và chỉ tiêu tuyển dụng.", href: "/dashboard?section=jobs", icon: BriefcaseBusiness },
    { id: "pipeline", label: "Tiến trình tuyển dụng", description: "Theo dõi ứng viên qua từng giai đoạn tuyển dụng.", href: "/dashboard?section=pipeline", icon: GitBranch },
    { id: "interview-hub", label: "Lịch phỏng vấn", description: "Quản lý lịch hẹn và các trao đổi với ứng viên.", href: "/dashboard?section=interview-hub", icon: CalendarDays },
    { id: "contact-candidates", label: "Liên hệ ứng viên", description: "Soạn thư và quản lý liên hệ theo từng ứng viên.", href: "/dashboard?section=contact-candidates", icon: Mail },
  ] },
  { label: "Trợ lý & phát triển nghề nghiệp", items: [
    { id: "ai-assistant", label: "Insight Match", description: "Trao đổi về tuyển dụng và nghiên cứu thông tin có nguồn tham khảo.", href: "/ai-assistant", icon: Bot },
    { id: "career-compass", label: "Career Match", description: "Khám phá thế mạnh, nhóm nghề phù hợp và lộ trình phát triển.", href: "/career-compass", icon: Compass },
    { id: "interview-gen", label: "Interview Match", description: "Chuẩn bị câu hỏi và tiêu chí đánh giá cho buổi phỏng vấn.", href: "/interview-questions", icon: ClipboardCheck },
    { id: "salary-benchmark", label: "Salary Match", description: "So sánh dải lương theo chức danh, kinh nghiệm và khu vực.", href: "/salary-benchmark", icon: Wallet },
  ] },
  { label: "Báo cáo & thiết lập", items: [
    { id: "history", label: "Lịch sử đánh giá", description: "Tra cứu kết quả các phiên sàng lọc đã lưu.", href: "/dashboard?section=history", icon: History },
    { id: "reports", label: "Báo cáo tuyển dụng", description: "Tổng hợp kết quả đánh giá và xuất báo cáo theo phiên.", href: "/dashboard?section=reports", icon: BarChart3 },
    { id: "criteria-settings", label: "Tiêu chí đánh giá", description: "Thiết lập trọng số và điều kiện sàng lọc cho từng yêu cầu.", href: "/dashboard?section=criteria-settings", icon: SlidersHorizontal },
    { id: "settings", label: "Cài đặt", description: "Quản lý hồ sơ tài khoản và tùy chọn làm việc.", href: "/dashboard?section=settings", icon: Settings2 },
  ] },
];

export const navigationItems = navigationGroups.flatMap((group) => group.items);

export function canonicalSection(section: Section): Section {
  if (section === "quick-score") return "match-workflow";
  if (section === "chatbot") return "ai-assistant";
  return section;
}

export const standaloneSectionRoutes: Partial<Record<Section, string>> = {
  "match-workflow": "/cv-match", "quick-score": "/cv-match",
  chatbot: "/ai-assistant", "ai-assistant": "/ai-assistant", "career-compass": "/career-compass",
  "interview-gen": "/interview-questions", "salary-benchmark": "/salary-benchmark",
};

export function sectionHref(section: Section): string {
  const canonical = canonicalSection(section);
  return standaloneSectionRoutes[canonical] || (canonical === "overview" ? "/dashboard" : `/dashboard?section=${canonical}`);
}

// Compatibility entrypoints; each legacy page redirects to its dedicated tool route.
export function isSection(value: string): value is Section {
  return navigationItems.some((item) => item.id === value) || value === "quick-score" || value === "chatbot";
}
