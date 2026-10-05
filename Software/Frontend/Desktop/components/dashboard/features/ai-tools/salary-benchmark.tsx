"use client";

import { useState, useMemo, useRef } from "react";
import {
  getMarketSalaryReport,
  type MarketSalaryReport,
  VIETNAM_LOCATIONS,
  WORK_MODES,
  INDUSTRY_SECTORS,
} from "@/lib/salary-crawler-engine";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  TrendingUp,
  Search,
  Sparkles,
  MapPin,
  Briefcase,
  Layers,
  Calculator,
  CheckCircle2,
  Download,
  Zap,
  Tag,
  GraduationCap,
  ArrowLeft,
  Flame,
  Building2,
  ChevronRight,
  Clock,
  ListFilter,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

// Mapping Industry to Specific Job Roles
export const INDUSTRY_ROLES_MAP: Record<string, string[]> = {
  "Tất cả ngành nghề": [
    "DevOps",
    "Kế toán trưởng",
    "Kế toán tổng hợp",
    "Nhân viên kinh doanh",
    "Trưởng phòng kinh doanh",
    "Frontend Developer",
    "Backend Developer",
    "AI / Machine Learning",
    "Digital Marketing",
    "Hành chính nhân sự",
    "Xuất nhập khẩu",
    "UI/UX Designer",
    "Product Owner / BA",
    "Kỹ sư Cơ khí",
    "Dược sĩ",
  ],
  "Công nghệ thông tin": [
    "DevOps Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Fullstack Developer",
    "AI / Machine Learning Engineer",
    "Data Engineer / Data Scientist",
    "Mobile Developer (iOS/Android)",
    "QA / QC Tester",
    "Product Owner / Business Analyst (BA)",
    "System Administrator / Cloud Engineer",
  ],
  "Tài chính / Kế toán": [
    "Kế toán trưởng",
    "Kế toán tổng hợp",
    "Chuyên viên phân tích tài chính",
    "Kế toán thuế",
    "Kiểm toán viên (Auditor)",
    "Kế toán công nợ / kho",
    "Giám đốc tài chính (CFO)",
  ],
  "Kinh doanh / Bán hàng": [
    "Nhân viên kinh doanh (Sales Executive)",
    "Trưởng phòng kinh doanh (Sales Manager)",
    "Chuyên viên Sales B2B / Enterprise",
    "Telesales Specialist",
    "Giám đốc kinh doanh (CCO)",
    "Key Account Manager (KAM)",
    "Chuyên viên Phát triển thị trường (BD)",
  ],
  "Marketing & Truyền thông": [
    "Chuyên viên Digital Marketing",
    "Content Marketing Specialist",
    "Performance Marketing / Media Buyer",
    "SEO Specialist",
    "Trưởng phòng Marketing (Marketing Manager)",
    "Chuyên viên PR & Truyền thông",
    "Social Media & Community Specialist",
  ],
  "Hành chính / Nhân sự": [
    "Chuyên viên Tuyển dụng (Talent Acquisition)",
    "Chuyên viên C&B (Lương & Phúc lợi)",
    "Chuyên viên Hành chính Nhân sự (HR Admin)",
    "Trưởng phòng Nhân sự (HR Manager)",
    "HRBP (Đối tác Nhân sự Chiến lược)",
    "Chuyên viên Đào tạo & Phát triển (L&D)",
  ],
  "Thiết kế / Sáng tạo": [
    "UI/UX Product Designer",
    "Graphic Designer 2D",
    "Motion Designer / Video Editor",
    "3D Artist / CGI Specialist",
    "Giám đốc nghệ thuật (Art Director)",
  ],
  "Logistics / Xuất nhập khẩu": [
    "Chuyên viên Xuất nhập khẩu (Import-Export)",
    "Chuyên viên Logistics & Kho vận",
    "Chuyên viên Mua hàng (Purchasing Specialist)",
    "Quản lý Chuỗi cung ứng (Supply Chain Manager)",
    "Nhân viên Khai báo Hải quan",
  ],
  "Dịch vụ khách hàng": [
    "Chuyên viên Chăm sóc khách hàng (Customer Care)",
    "Tư vấn viên / Tổng đài viên (Customer Support)",
    "Trưởng nhóm CSKH (Customer Service Leader)",
    "Chuyên viên Quản trị Trải nghiệm khách hàng (CX)",
  ],
  "Kỹ thuật / Sản xuất": [
    "Kỹ sư Cơ khí",
    "Kỹ sư Điện - Tự động hóa",
    "Kỹ sư Xây dựng / Giám sát công trình",
    "Quản lý Sản xuất / Quản đốc nhà máy",
    "Kỹ sư QA/QC Sản xuất",
  ],
  "Y tế / Dược phẩm": [
    "Trình dược viên (Medical Representative)",
    "Dược sĩ Lâm sàng",
    "Bác sĩ Đa khoa",
    "Quản lý Sản phẩm Y Dược (Product Manager)",
  ],
  "Giáo dục / Đào tạo": [
    "Giáo viên / Giảng viên Tiếng Anh",
    "Chuyên viên Học vụ / Quản lý lớp",
    "Chuyên gia Đào tạo Doanh nghiệp",
  ],
  "Bất động sản": [
    "Chuyên viên Môi giới Bất động sản",
    "Quản lý Dự án Bất động sản",
    "Chuyên viên Định giá Bất động sản",
  ],
  "Ngân hàng / Bảo hiểm": [
    "Chuyên viên Quan hệ Khách hàng (RM)",
    "Chuyên viên Thẩm định Tín dụng",
    "Tư vấn Tài chính & Bảo hiểm",
  ],
  "Nhà hàng / Khách sạn": [
    "Quản lý Nhà hàng / Khách sạn (F&B / Hotel Manager)",
    "Bếp trưởng / Bếp chính",
    "Chuyên viên Điều hành Tour / Dịch vụ",
  ],
  "Pháp lý / Luật": [
    "Chuyên viên Pháp lý Doanh nghiệp (Legal Officer)",
    "Luật sư Tư vấn (Legal Consultant)",
    "Chuyên viên Pháp chế & Tuân thủ",
  ],
};

// Popular Tags with automatic category mapping
export const POPULAR_ROLES_WITH_INDUSTRY = [
  { role: "DevOps", category: "Công nghệ thông tin" },
  { role: "Kế toán trưởng", category: "Tài chính / Kế toán" },
  { role: "Kế toán tổng hợp", category: "Tài chính / Kế toán" },
  { role: "Nhân viên kinh doanh", category: "Kinh doanh / Bán hàng" },
  { role: "Trưởng phòng kinh doanh", category: "Kinh doanh / Bán hàng" },
  { role: "Frontend Developer", category: "Công nghệ thông tin" },
  { role: "Backend Developer", category: "Công nghệ thông tin" },
  { role: "AI / Machine Learning", category: "Công nghệ thông tin" },
  { role: "Digital Marketing", category: "Marketing & Truyền thông" },
  { role: "Hành chính nhân sự", category: "Hành chính / Nhân sự" },
  { role: "Xuất nhập khẩu", category: "Logistics / Xuất nhập khẩu" },
  { role: "UI/UX Designer", category: "Thiết kế / Sáng tạo" },
];

export function SalaryBenchmarkSection() {
  const formRef = useRef<HTMLDivElement>(null);

  // Page View State: "search" (Page 1) | "loading" (Transition) | "result" (Page 2)
  const [currentView, setCurrentView] = useState<"search" | "loading" | "result">("search");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStepText, setLoadingStepText] = useState("Đang kết nối cơ sở dữ liệu thị trường...");

  // Search Inputs (Unselected by default to require full user confirmation)
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedExp, setSelectedExp] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedWorkMode, setSelectedWorkMode] = useState("all");

  // Field Error Highlights
  const [fieldErrors, setFieldErrors] = useState<{
    title?: boolean;
    category?: boolean;
    location?: boolean;
    exp?: boolean;
  }>({});

  // Role Selection Mode: "dropdown" (when industry is selected) | "input" (free text typing)
  const [roleInputMode, setRoleInputMode] = useState<"dropdown" | "input">("dropdown");

  // Active Query State for Page 2
  const [activeQuery, setActiveQuery] = useState("");
  const [activeLocation, setActiveLocation] = useState("");
  const [activeExp, setActiveExp] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeWorkMode, setActiveWorkMode] = useState("all");

  // Offer Simulator State
  const [simLevel, setSimLevel] = useState<"fresher" | "junior" | "mid" | "senior">("senior");
  const [simYears, setSimYears] = useState("5");
  const [simOffer, setSimOffer] = useState("28 – 38 Triệu VNĐ/tháng");

  // Fetch Report Data from Universal Calculation Engine
  const report: MarketSalaryReport = useMemo(() => {
    return getMarketSalaryReport(
      activeQuery || "Kế toán trưởng",
      activeLocation || "all",
      activeCategory || "Tất cả ngành nghề",
      activeWorkMode || "all"
    );
  }, [activeQuery, activeLocation, activeCategory, activeWorkMode]);

  // Grouped Locations by Region for Dropdown
  const locationGroups = useMemo(() => {
    const groups: Record<string, typeof VIETNAM_LOCATIONS> = {};
    VIETNAM_LOCATIONS.forEach((loc) => {
      if (!groups[loc.group]) groups[loc.group] = [];
      groups[loc.group].push(loc);
    });
    return groups;
  }, []);

  // Available Job Roles for the currently selected Industry Category
  const availableRolesForCategory = useMemo(() => {
    if (selectedCategory && INDUSTRY_ROLES_MAP[selectedCategory]) {
      return INDUSTRY_ROLES_MAP[selectedCategory];
    }
    return INDUSTRY_ROLES_MAP["Tất cả ngành nghề"];
  }, [selectedCategory]);

  // Validation function: Verifies all mandatory fields are selected
  const validateSearchCriteria = (
    title: string,
    category: string,
    location: string,
    exp: string
  ): boolean => {
    const errors: { title?: boolean; category?: boolean; location?: boolean; exp?: boolean } = {};

    if (!title.trim() || title === "-- Chọn chức danh vị trí --") {
      errors.title = true;
    }
    if (!category.trim() || category === "-- Chọn ngành nghề --") {
      errors.category = true;
    }
    if (!location.trim()) {
      errors.location = true;
    }
    if (!exp.trim()) {
      errors.exp = true;
    }

    setFieldErrors(errors);

    if (errors.title || errors.category || errors.location || errors.exp) {
      // Build specific message
      const missingList: string[] = [];
      if (errors.title) missingList.push("Chức danh / Vị trí");
      if (errors.category) missingList.push("Ngành nghề");
      if (errors.location) missingList.push("Khu vực làm việc");
      if (errors.exp) missingList.push("Số năm kinh nghiệm");

      toast.error(`Vui lòng chọn đầy đủ thông tin: ${missingList.join(", ")} trước khi tra cứu!`, {
        duration: 4000,
      });

      // Scroll to form smoothly
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    setFieldErrors({});
    return true;
  };

  // Handle Search Submission with High-End Loading Transition
  const executeSearch = (
    titleVal?: string,
    locVal?: string,
    catVal?: string,
    expVal?: string,
    modeVal?: string
  ) => {
    const targetTitle = (titleVal !== undefined ? titleVal : searchTitle).trim();
    const targetCategory = (catVal !== undefined ? catVal : selectedCategory).trim();
    const targetLoc = (locVal !== undefined ? locVal : selectedLocation).trim();
    const targetExp = (expVal !== undefined ? expVal : selectedExp).trim();
    const targetMode = modeVal !== undefined ? modeVal : selectedWorkMode;

    const isValid = validateSearchCriteria(targetTitle, targetCategory, targetLoc, targetExp);
    if (!isValid) return;

    setActiveQuery(targetTitle);
    setActiveLocation(targetLoc);
    setActiveCategory(targetCategory);
    setActiveExp(targetExp);
    setActiveWorkMode(targetMode);

    // Switch to Loading View
    setCurrentView("loading");
    setLoadingProgress(10);
    setLoadingStepText(`Khởi tạo phân tích thị trường cho vị trí "${targetTitle}"...`);

    // Multi-step Loading Animation (1.2s total)
    setTimeout(() => {
      setLoadingProgress(45);
      setLoadingStepText(`Đang đối chiếu dữ liệu tại khu vực và dải phân vị chuẩn...`);
    }, 380);

    setTimeout(() => {
      setLoadingProgress(85);
      setLoadingStepText("Chuẩn bị biểu đồ dải lương và định giá tuyển dụng...");
    }, 800);

    setTimeout(() => {
      setLoadingProgress(100);
      setCurrentView("result");
      toast.success(`Đã phân tích thành công mức lương cho vị trí "${targetTitle}"!`);
    }, 1200);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch();
  };

  // Back to Search View
  const handleBackToSearch = () => {
    setCurrentView("search");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 8 Major Categories for Page 1 Discovery
  const discoveryCategories = [
    {
      name: "Tài chính / Kế toán",
      roles: ["Kế toán trưởng", "Kế toán tổng hợp", "Chuyên viên tài chính"],
      salaryRange: "14 - 30 Tr",
      icon: DollarSign,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      name: "Công nghệ thông tin",
      roles: ["DevOps Engineer", "Frontend Developer", "Backend Developer", "AI Engineer"],
      salaryRange: "20 - 40 Tr",
      icon: Layers,
      color: "text-sky-600 bg-sky-50 border-sky-100",
    },
    {
      name: "Kinh doanh / Bán hàng",
      roles: ["Nhân viên kinh doanh", "Trưởng phòng kinh doanh", "Sales B2B"],
      salaryRange: "15 - 38 Tr",
      icon: TrendingUp,
      color: "text-cyan-600 bg-cyan-50 border-cyan-100",
    },
    {
      name: "Marketing & Truyền thông",
      roles: ["Digital Marketing", "Content Specialist", "Marketing Manager"],
      salaryRange: "13.5 - 25 Tr",
      icon: Sparkles,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      name: "Hành chính / Nhân sự",
      roles: ["Chuyên viên tuyển dụng", "HR Executive", "HR Manager"],
      salaryRange: "12.5 - 25 Tr",
      icon: Briefcase,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      name: "Thiết kế / Sáng tạo",
      roles: ["UI/UX Designer", "Graphic Designer", "Product Designer"],
      salaryRange: "14 - 28 Tr",
      icon: Zap,
      color: "text-pink-600 bg-pink-50 border-pink-100",
    },
    {
      name: "Logistics / Xuất nhập khẩu",
      roles: ["Chuyên viên xuất nhập khẩu", "Quản lý kho vận", "Supply Chain"],
      salaryRange: "13.5 - 26 Tr",
      icon: Building2,
      color: "text-teal-600 bg-teal-50 border-teal-100",
    },
    {
      name: "Dịch vụ khách hàng",
      roles: ["Chăm sóc khách hàng", "Customer Care", "Telesales"],
      salaryRange: "10 - 18 Tr",
      icon: CheckCircle2,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  // Calculate percentages for Spectrum Bar (Page 2)
  const { lowPct, midPct, highPct, avgPct } = useMemo(() => {
    const totalSpan = Math.max(report.overallMax - report.overallMin, 1);
    const lowWidth = Math.max(((report.popularMin - report.overallMin) / totalSpan) * 100, 18);
    const midWidth = Math.max(((report.popularMax - report.popularMin) / totalSpan) * 100, 30);
    const highWidth = Math.max(100 - lowWidth - midWidth, 18);
    const avgPos = Math.min(Math.max(((report.avgSalary - report.overallMin) / totalSpan) * 100, 5), 95);

    return { lowPct: lowWidth, midPct: midWidth, highPct: highWidth, avgPct: avgPos };
  }, [report]);

  // Handle Offer Simulator
  const handleCalculateOffer = () => {
    let result = `${report.popularMin} – ${report.popularMax} Triệu VNĐ/tháng`;
    if (simLevel === "fresher") {
      result = `${Math.round(report.popularMin * 0.6 * 10) / 10} – ${Math.round(report.popularMin * 0.85 * 10) / 10} Triệu VNĐ/tháng`;
    } else if (simLevel === "junior") {
      result = `${Math.round(report.popularMin * 0.85 * 10) / 10} – ${report.popularMin} Triệu VNĐ/tháng`;
    } else if (simLevel === "mid") {
      result = `${report.popularMin} – ${report.avgSalary} Triệu VNĐ/tháng`;
    } else if (simLevel === "senior") {
      result = `${report.avgSalary} – ${report.popularMax} Triệu VNĐ/tháng`;
    }
    setSimOffer(result);
    toast.success("Đã tính toán dải lương tuyển dụng đề xuất!");
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvRows = [
      `"BÁO CÁO MỨC LƯƠNG THỊ TRƯỜNG LAO ĐỘNG 2026: ${report.jobTitle.toUpperCase()}"`,
      `"Nhóm ngành:","${report.category}"`,
      `"Địa điểm:","${report.locationLabel}"`,
      `"Hình thức làm việc:","${report.workModeLabel}"`,
      `"Mức lương trung bình:","${report.avgSalary} Triệu VNĐ/tháng"`,
      `"Khoảng lương phổ biến:","${report.popularMin} - ${report.popularMax} Triệu VNĐ/tháng"`,
      `"Dải lương thị trường:","${report.overallMin} - ${report.overallMax} Triệu VNĐ/tháng"`,
      "",
      `"PHÂN BỐ THEO SỐ NĂM KINH NGHIỆM"`,
      ...report.expData.map((d) => `"${d.expLabel}","${d.salary} Triệu VNĐ/tháng"`),
      "",
      `"PHÂN BỐ THEO KHU VỰC ĐỊA LÝ"`,
      ...report.cityData.map((c) => `"${c.cityName}","${c.salary} Triệu VNĐ/tháng"`),
      "",
      `"KỸ NĂNG TRỌNG TÂM:","${report.skills.join(", ")}"`,
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao_cao_luong_${report.jobTitle.toLowerCase().replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Đã xuất báo cáo mức lương ra tệp CSV thành công!");
  };

  // Summary KPIs for Page 2
  const summaryKpis = [
    {
      title: "Mức Lương Trung Bình",
      value: `${report.avgSalary} Tr`,
      unit: "VNĐ/tháng",
      subtext: `Mức phổ biến nhất thị trường`,
      icon: DollarSign,
      trend: "Chuẩn P50",
      accent: "text-sky-600 bg-sky-50 border border-sky-100",
    },
    {
      title: "Khoảng Lương Phổ Biến",
      value: `${report.popularMin} - ${report.popularMax} Tr`,
      unit: "VNĐ/tháng",
      subtext: `Hơn 75% doanh nghiệp chi trả`,
      icon: TrendingUp,
      trend: "P25 – P75",
      accent: "text-blue-600 bg-blue-50 border border-blue-100",
    },
    {
      title: "Dải Lương Toàn Thị Trường",
      value: `${report.overallMin} - ${report.overallMax} Tr`,
      unit: "VNĐ/tháng",
      subtext: `Khởi điểm đến cấp quản lý`,
      icon: Layers,
      trend: "Min – Max",
      accent: "text-cyan-600 bg-cyan-50 border border-cyan-100",
    },
    {
      title: "Khu Vực & Hình Thức",
      value: report.locationLabel.split("(")[0].trim(),
      unit: report.workModeLabel.split("(")[0].trim(),
      subtext: `${report.category}`,
      icon: Sparkles,
      trend: "34 Tỉnh Thành",
      accent: "text-indigo-600 bg-indigo-50 border border-indigo-100",
    },
  ];

  /* =========================================================================================
   * VIEW 1: SEARCH & DISCOVERY PAGE (PAGE 1 - TRANG TRA CỨU THÔNG TIN)
   * ========================================================================================= */
  if (currentView === "search") {
    return (
      <div className="space-y-5">
        {/* Compact Full-Width Search Console Card */}
        <Card ref={formRef} className="border-border bg-card shadow-xs overflow-hidden w-full">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-50/50 via-white to-blue-50/30 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-4.5 h-4.5 text-sky-600" />
                  <span>Tra Cứu Mức Lương Thị Trường Lao Động Việt Nam 2026</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vui lòng chọn đầy đủ <strong>Chức danh</strong>, <strong>Ngành nghề</strong>, <strong>Khu vực</strong> và <strong>Kinh nghiệm</strong> để nhận báo cáo chuẩn xác
                </p>
              </div>
            </div>

            {/* Optimized Full-Width Low-Profile Search Bar */}
            <form onSubmit={handleSearchSubmit} className="w-full space-y-3">
              <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-sky-200/90 shadow-xs space-y-3">
                {/* 5 Fields + Action Button In Balanced Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-2.5 items-end">
                  {/* Field 1: Job Title (Smart Dropdown / Input Mode) (4 cols) */}
                  <div className="space-y-1 lg:col-span-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Search className="w-3 h-3 text-sky-600" />
                        <span>Chức danh / Vị trí <strong className="text-rose-500">*</strong></span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => setRoleInputMode(roleInputMode === "dropdown" ? "input" : "dropdown")}
                        className="text-[10px] text-sky-600 hover:text-sky-800 font-medium flex items-center gap-0.5"
                        title="Chuyển đổi giữa menu chọn và gõ tự do"
                      >
                        <ListFilter className="w-2.5 h-2.5" />
                        <span>{roleInputMode === "dropdown" ? "Gõ tự do" : "Chọn từ danh sách"}</span>
                      </button>
                    </div>

                    {roleInputMode === "dropdown" ? (
                      <select
                        value={searchTitle}
                        onChange={(e) => {
                          setSearchTitle(e.target.value);
                          if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: false });
                        }}
                        className={cn(
                          "w-full bg-slate-50 border text-xs rounded-md px-2.5 py-1.5 font-medium focus:bg-white focus:outline-none focus:ring-1 h-9 truncate transition-colors",
                          fieldErrors.title
                            ? "border-rose-400 ring-1 ring-rose-400 text-rose-900 bg-rose-50/20"
                            : "border-slate-200 text-slate-800 focus:ring-sky-500"
                        )}
                      >
                        <option value="">-- Chọn chức danh vị trí --</option>
                        {availableRolesForCategory.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="relative">
                        <Input
                          placeholder="Nhập tên chức danh vị trí..."
                          value={searchTitle}
                          onChange={(e) => {
                            setSearchTitle(e.target.value);
                            if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: false });
                          }}
                          className={cn(
                            "bg-slate-50 text-xs h-9 pr-7 font-medium focus:bg-white transition-colors",
                            fieldErrors.title
                              ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/20"
                              : "border-slate-200"
                          )}
                        />
                        {searchTitle && (
                          <button
                            type="button"
                            onClick={() => setSearchTitle("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Field 2: Industry Category (2 cols) */}
                  <div className="space-y-1 lg:col-span-2">
                    <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-sky-600" />
                      <span>Ngành nghề <strong className="text-rose-500">*</strong></span>
                    </Label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setSelectedCategory(newCat);
                        if (fieldErrors.category) setFieldErrors({ ...fieldErrors, category: false });

                        // Switch to dropdown and reset position selection so user chooses explicitly
                        setRoleInputMode("dropdown");
                        const roles = INDUSTRY_ROLES_MAP[newCat] || [];
                        if (roles.length > 0) {
                          setSearchTitle("");
                        }
                      }}
                      className={cn(
                        "w-full bg-slate-50 border text-xs rounded-md px-2.5 py-1.5 font-medium focus:bg-white focus:outline-none focus:ring-1 h-9 truncate transition-colors",
                        fieldErrors.category
                          ? "border-rose-400 ring-1 ring-rose-400 text-rose-900 bg-rose-50/20"
                          : "border-slate-200 text-slate-800 focus:ring-sky-500"
                      )}
                    >
                      <option value="">-- Chọn ngành nghề --</option>
                      {INDUSTRY_SECTORS.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field 3: Location (34+ Provinces) (2 cols) */}
                  <div className="space-y-1 lg:col-span-2">
                    <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-600" />
                      <span>Khu vực (34 tỉnh) <strong className="text-rose-500">*</strong></span>
                    </Label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => {
                        setSelectedLocation(e.target.value);
                        if (fieldErrors.location) setFieldErrors({ ...fieldErrors, location: false });
                      }}
                      className={cn(
                        "w-full bg-slate-50 border text-xs rounded-md px-2.5 py-1.5 font-medium focus:bg-white focus:outline-none focus:ring-1 h-9 truncate transition-colors",
                        fieldErrors.location
                          ? "border-rose-400 ring-1 ring-rose-400 text-rose-900 bg-rose-50/20"
                          : "border-slate-200 text-slate-800 focus:ring-sky-500"
                      )}
                    >
                      <option value="">-- Chọn khu vực làm việc --</option>
                      {Object.entries(locationGroups).map(([groupName, locs]) => (
                        <optgroup key={groupName} label={`📍 ${groupName}`}>
                          {locs.map((loc) => (
                            <option key={loc.key} value={loc.key}>
                              {loc.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Field 4: Experience (2 cols) */}
                  <div className="space-y-1 lg:col-span-2">
                    <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-sky-600" />
                      <span>Kinh nghiệm <strong className="text-rose-500">*</strong></span>
                    </Label>
                    <select
                      value={selectedExp}
                      onChange={(e) => {
                        setSelectedExp(e.target.value);
                        if (fieldErrors.exp) setFieldErrors({ ...fieldErrors, exp: false });
                      }}
                      className={cn(
                        "w-full bg-slate-50 border text-xs rounded-md px-2.5 py-1.5 font-medium focus:bg-white focus:outline-none focus:ring-1 h-9 truncate transition-colors",
                        fieldErrors.exp
                          ? "border-rose-400 ring-1 ring-rose-400 text-rose-900 bg-rose-50/20"
                          : "border-slate-200 text-slate-800 focus:ring-sky-500"
                      )}
                    >
                      <option value="">-- Chọn số năm kinh nghiệm --</option>
                      <option value="fresher">Dưới 1 năm (Fresher)</option>
                      <option value="junior">1 – 3 năm (Junior)</option>
                      <option value="mid">3 – 5 năm (Mid-Level)</option>
                      <option value="senior">Trên 5 năm (Senior/Lead)</option>
                    </select>
                  </div>

                  {/* Field 5: Action Search Button (2 cols) */}
                  <div className="space-y-1 lg:col-span-2">
                    <Button
                      type="submit"
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-9 rounded-md shadow-xs transition-all"
                    >
                      <Search className="w-3.5 h-3.5 mr-1" />
                      <span>Tra Cứu Lương</span>
                    </Button>
                  </div>
                </div>

                {/* Inline Work Mode & Popular Keywords Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  {/* Left: Quick Trending Career Pills with Auto-Category Mapping */}
                  <div className="flex items-center gap-1.5 flex-wrap text-muted-foreground">
                    <span className="font-semibold text-slate-700 text-[11px] mr-0.5">Vị trí phổ biến:</span>
                    {POPULAR_ROLES_WITH_INDUSTRY.map(({ role, category }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSearchTitle(role);
                          setSelectedCategory(category);
                          setRoleInputMode("dropdown");

                          // Clear field errors for title & category
                          setFieldErrors((prev) => ({ ...prev, title: false, category: false }));

                          // If location or experience is missing, do NOT transition to page 2 yet
                          if (!selectedLocation || !selectedExp) {
                            toast.info(`Đã điền Vị trí: "${role}" & Ngành: "${category}". Vui lòng chọn nốt Khu vực và Kinh nghiệm để tra cứu!`);
                            setFieldErrors((prev) => ({
                              ...prev,
                              location: !selectedLocation,
                              exp: !selectedExp,
                            }));
                            formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                            return;
                          }

                          // If all fields are already present, execute search directly
                          executeSearch(role, selectedLocation, category, selectedExp, selectedWorkMode);
                        }}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 border border-slate-200/80 transition-colors"
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  {/* Right: Work Mode Filter Pill */}
                  <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-slate-600">
                    <Clock className="w-3 h-3 text-sky-600" />
                    <span>Hình thức:</span>
                    <select
                      value={selectedWorkMode}
                      onChange={(e) => setSelectedWorkMode(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-[11px] rounded px-1.5 py-0.5 font-medium text-slate-800 focus:outline-none"
                    >
                      {WORK_MODES.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </Card>

        {/* 8 Industry Categories Grid (When clicked: Auto fills Category, turns Job Title into dropdown, guides user to complete remaining fields) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-sky-600" />
              <span>Khám Phá Mức Lương Theo Nhóm Ngành Nghề</span>
            </h3>
            <span className="text-xs text-muted-foreground">Nhấp vào ngành để nạp danh sách vị trí và chọn tiêu chí tra cứu</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {discoveryCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.name}
                  className="p-4.5 rounded-xl bg-card border border-border hover:border-sky-300 transition-all duration-200 shadow-xs group cursor-pointer flex flex-col justify-between"
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setSearchTitle(""); // Keep unselected so user chooses exact role from dropdown
                    setRoleInputMode("dropdown");

                    setFieldErrors({
                      title: true,
                      category: false,
                      location: !selectedLocation,
                      exp: !selectedExp,
                    });

                    toast.info(`Đã chọn ngành "${cat.name}". Vui lòng chọn Chức danh vị trí, Khu vực và Kinh nghiệm trên thanh tra cứu!`, {
                      duration: 4500,
                    });

                    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cat.color}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <Badge variant="outline" className="bg-sky-50/50 text-sky-700 border-sky-100 text-[10px] font-bold">
                        {cat.salaryRange}
                      </Badge>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                      {cat.name}
                    </h4>

                    <div className="mt-2 space-y-1">
                      {cat.roles.map((role) => (
                        <span
                          key={role}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(cat.name);
                            setSearchTitle(role);
                            setRoleInputMode("dropdown");

                            if (!selectedLocation || !selectedExp) {
                              toast.info(`Đã chọn vị trí "${role}". Vui lòng chọn nốt Khu vực và Kinh nghiệm để tra cứu!`);
                              setFieldErrors({
                                title: false,
                                category: false,
                                location: !selectedLocation,
                                exp: !selectedExp,
                              });
                              formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                              return;
                            }

                            executeSearch(role, selectedLocation, cat.name, selectedExp, selectedWorkMode);
                          }}
                          className="inline-block mr-1.5 mb-1 px-2 py-0.5 rounded text-[10px] bg-slate-50 text-slate-600 hover:bg-sky-100 hover:text-sky-800 border border-slate-200/60 transition-colors"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-sky-600 font-semibold">
                    <span>Chọn ngành này</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================================
   * VIEW 2: LOADING TRANSITION STATE (HIỆU ỨNG CHUYỂN BƯỚC SANG TRANG KẾT QUẢ)
   * ========================================================================================= */
  if (currentView === "loading") {
    return (
      <div className="min-h-[480px] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center bg-white border-sky-100 shadow-lg shadow-sky-500/5 space-y-6 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Glowing Animated Radar Circle */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-sky-500/30 animate-pulse" />
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/30 z-10">
              <Search className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          {/* Dynamic Status Text */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Đang Phân Tích Mức Lương Thị Trường
            </h3>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 py-1 px-3 rounded-full border border-sky-100">
                Vị trí: <strong>{activeQuery}</strong>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loadingStepText}
            </p>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div
                style={{ width: `${loadingProgress}%` }}
                className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>Đang xử lý</span>
              <span>{loadingProgress}%</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* =========================================================================================
   * VIEW 3: FULL RESULTS & DASHBOARD PAGE (PAGE 2 - TRANG KẾT QUẢ PHÂN TÍCH CHI TIẾT)
   * ========================================================================================= */
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Navigation Bar + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleBackToSearch}
            className="h-9 px-3 text-xs font-bold text-slate-800 hover:text-sky-700 hover:bg-sky-50 border-slate-200 bg-white shadow-2xs gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Tra Cứu Khác</span>
          </Button>

          <div className="hidden sm:block w-px h-6 bg-border" />

          {/* Active Query Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-xs font-bold px-2.5 py-0.5">
              {report.jobTitle}
            </Badge>
            <Badge variant="outline" className="text-slate-700 text-xs">
              📍 {report.locationLabel}
            </Badge>
            <Badge variant="outline" className="text-slate-700 text-xs">
              🎓 {activeExp === "fresher" ? "Dưới 1 năm" : activeExp === "junior" ? "1-3 năm" : activeExp === "mid" ? "3-5 năm" : "Trên 5 năm"}
            </Badge>
            <Badge variant="outline" className="text-slate-700 text-xs">
              💼 {report.workModeLabel}
            </Badge>
            <Badge variant="outline" className="text-slate-700 text-xs">
              🏢 {report.category}
            </Badge>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleExportCSV}
          className="h-9 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs self-start sm:self-auto shrink-0"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Xuất Báo Cáo Lương (CSV)
        </Button>
      </div>

      {/* 1. TOP 4 SUMMARY KPI CARDS (MATCHING OVERVIEW SECTION) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-card border border-border rounded-xl p-4.5 hover:border-sky-300 transition-all duration-300 shadow-xs group"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.accent}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  <Flame className="w-3 h-3 text-sky-600" />
                  {kpi.trend}
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">{kpi.title}</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight truncate">
                {kpi.value}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                <span className="truncate">{kpi.subtext}</span>
                <span className="text-[10px] font-mono text-sky-600 shrink-0 font-bold">{kpi.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. HERO SALARY SPECTRUM DISPLAY */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/70 bg-gradient-to-r from-sky-50/40 via-white to-blue-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  Dải Lương Chi Tiết: {report.jobTitle}
                </CardTitle>
                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">
                  {report.category}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Áp dụng tại <strong>{report.locationLabel}</strong> • Hình thức: <strong>{report.workModeLabel}</strong>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* 2 Primary Metric Summary Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50/40 border border-sky-200/80">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wide block">
                Mức Lương Trung Bình (P50)
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-sky-950 mt-1 tracking-tight">
                {report.avgSalary} Triệu VNĐ/tháng
              </p>
              <span className="text-[11px] text-sky-700 font-medium mt-1 block">
                Mức thu nhập bình quân phản ánh theo cung cầu thị trường
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50/40 border border-cyan-200/80">
              <span className="text-xs font-bold text-cyan-800 uppercase tracking-wide block">
                Khoảng Lương Phổ Biến (P25 - P75)
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-950 mt-1 tracking-tight">
                {report.popularMin} – {report.popularMax} Triệu VNĐ/tháng
              </p>
              <span className="text-[11px] text-cyan-700 font-medium mt-1 block">
                Dải chi trả phổ biến nhất tại hơn 75% doanh nghiệp
              </span>
            </div>
          </div>

          {/* Visual 3-Segment Spectrum Meter Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="text-[11px] font-mono font-bold text-slate-500">Mức Thấp ({report.overallMin} - {report.popularMin} Tr)</span>
              <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200 shadow-2xs">
                Dải Phổ Biến Nhất ({report.popularMin} – {report.popularMax} Tr)
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500">Mức Cao ({report.popularMax} - {report.overallMax} Tr)</span>
            </div>

            <div className="h-5.5 w-full rounded-md flex overflow-hidden shadow-inner relative p-0.5 bg-slate-100">
              {/* Segment 1: Low */}
              <div
                style={{ width: `${lowPct}%` }}
                className="bg-[#D69E2E] h-full rounded-l-sm transition-all duration-300"
              />
              {/* Segment 2: Popular */}
              <div
                style={{ width: `${midPct}%` }}
                className="bg-gradient-to-r from-sky-500 to-sky-600 h-full transition-all duration-300 relative"
              />
              {/* Segment 3: High */}
              <div
                style={{ width: `${highPct}%` }}
                className="bg-[#1E40AF] h-full rounded-r-sm transition-all duration-300"
              />

              {/* Pin Indicator */}
              <div
                style={{ left: `${avgPct}%` }}
                className="absolute top-0 bottom-0 w-1 bg-white shadow-md z-10 -translate-x-1/2 flex flex-col items-center justify-center"
              >
                <div className="w-3 h-3 bg-slate-900 rounded-full border-2 border-white shadow-xs" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 font-medium">
              <span className="font-mono text-[11px]">{report.overallMin} Tr (Min)</span>
              <span className="font-mono text-[11px] text-slate-700 font-bold">{report.popularMin} Tr</span>
              <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] font-extrabold px-2 py-0.5 shadow-2xs">
                Trung Bình: {report.avgSalary} Tr/tháng
              </Badge>
              <span className="font-mono text-[11px] text-slate-700 font-bold">{report.popularMax} Tr</span>
              <span className="font-mono text-[11px]">{report.overallMax} Tr (Max)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. SYMMETRICAL 2-COLUMN ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Theo kinh nghiệm */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/70">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-sky-600" />
              <span>Theo Kinh Nghiệm Làm Việc</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Lương trung bình/tháng vị trí {report.jobTitle} phân tích theo số năm kinh nghiệm
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.expData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="expLabel" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v} Tr`} domain={["dataMin - 2", "dataMax + 4"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      color: "#0f172a",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(v: any) => [`${v} Triệu VNĐ/tháng`, "Lương trung bình"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="salary"
                    name="Lương TB"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ fill: "#0284c7", r: 4, strokeWidth: 2, stroke: "#ffffff" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 mt-2">
              {report.expData.map((d) => (
                <div key={d.expLabel} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium truncate">{d.expLabel}</span>
                  <span className="text-xs font-extrabold text-sky-900 mt-0.5 block">{d.salary} Tr</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Theo khu vực */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/70">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>Theo Khu Vực Địa Lý</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              So sánh mức lương bình quân tại các tỉnh thành
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report.cityData}
                  layout="vertical"
                  margin={{ top: 5, right: 25, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v} Tr`} />
                  <YAxis type="category" dataKey="cityName" stroke="#334155" fontSize={11} width={95} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      color: "#0f172a",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(v: any) => [`${v} Triệu VNĐ/tháng`, "Lương trung bình"]}
                  />
                  <Bar dataKey="salary" fill="#0284c7" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-100 mt-2 px-1">
              <span>Khu vực cao nhất: <strong className="text-sky-700">TP.HCM (~{report.cityData.find(c => c.cityName.includes("Hồ Chí Minh"))?.salary || report.avgSalary} Tr)</strong></span>
              <span>Hà Nội: <strong className="text-slate-800">~{report.cityData.find(c => c.cityName.includes("Hà Nội"))?.salary || report.avgSalary} Tr</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. SKILLS & RECRUITER OFFER SUITE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills & Description */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-600" />
                <span>Kỹ Năng & Yếu Tố Giúp Nâng Cao Mức Thu Nhập: {report.jobTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {report.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-sky-50 text-sky-900 rounded-lg text-xs font-semibold border border-sky-200/80 hover:bg-sky-100 transition-colors"
                  >
                    ⚡ {skill}
                  </span>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong>Định vị thị trường:</strong> {report.description}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Offer Estimator */}
        <div>
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-sky-600" />
                <span>Định Giá Mức Offer Tuyển Dụng</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Ước lượng dải lương phù hợp cho ứng viên
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Cấp bậc ứng viên</Label>
                <select
                  value={simLevel}
                  onChange={(e: any) => setSimLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-md px-2.5 py-2 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="fresher">Mới tốt nghiệp / Fresher (&lt; 1 năm)</option>
                  <option value="junior">Nhân viên / Junior (1 – 3 năm)</option>
                  <option value="mid">Chuyên viên / Mid-Level (3 – 5 năm)</option>
                  <option value="senior">Chuyên viên cao cấp / Senior (&gt; 5 năm)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Số năm kinh nghiệm</Label>
                <Input
                  type="number"
                  value={simYears}
                  onChange={(e) => setSimYears(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-xs h-9"
                  min="0"
                  max="25"
                />
              </div>

              <Button
                onClick={handleCalculateOffer}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-9 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Tính Toán Mức Offer
              </Button>

              <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200 space-y-1.5 mt-2">
                <span className="text-[11px] font-bold text-sky-900 block">Dải Lương Khuyến Nghị:</span>
                <p className="text-base font-extrabold text-sky-950 tracking-tight">{simOffer}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
