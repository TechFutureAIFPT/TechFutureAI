"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSalesOps, type Section } from "@/lib/sales-ops-context";
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  Sparkles,
  Key,
  Sliders,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CandidateModal } from "@/components/dashboard/modals/candidate-modal";
import { AuthModal } from "@/components/dashboard/modals/auth-modal";

const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
  overview: {
    title: "Tổng Quan Tuyển Dụng & Chấm Điểm CV",
    subtitle: "Theo dõi thời gian thực tỉ lệ đối chiếu AI, số lượng hồ sơ và tiến độ lấp đầy vị trí",
  },
  workspace: {
    title: "Không Gian Làm Việc Recruiter",
    subtitle: "Trung tâm quản trị các chiến dịch tuyển dụng, phím tắt công cụ AI và hồ sơ gần đây",
  },
  "match-workflow": {
    title: "Quy Trình Đối Chiếu AI 5 Bước (AI Matching Wizard)",
    subtitle: "Luồng xử lý liền mạch: Chọn JD → Thiết Lập Rubric → Nạp CV → Chấm Điểm AI → Bảng Radar So Sánh",
  },
  pipeline: {
    title: "Phễu Tuyển Dụng Ứng Viên (Kanban)",
    subtitle: "Quản lý và chuyển bước hồ sơ ứng viên: Sơ loại → Đạt chuẩn → Phỏng vấn → Nhận việc",
  },
  candidates: {
    title: "Kho Hồ Sơ Ứng Viên & Bảng Điểm",
    subtitle: "Danh sách ứng viên, phân tích điểm kỹ năng, kinh nghiệm và kỳ vọng lương",
  },
  jobs: {
    title: "Vị Trí Tuyển Dụng & Mô Tả Công Việc (JD)",
    subtitle: "Quản lý chiến dịch tuyển dụng, chỉ tiêu và bộ trọng số đối chiếu AI Rubric",
  },
  chatbot: {
    title: "Trợ Lý AI Tuyển Dụng (Recruiter AI Assistant)",
    subtitle: "Trò chuyện tương tác trực tiếp với dữ liệu ứng viên, so sánh năng lực và tư vấn tuyển dụng",
  },
  "quick-score": {
    title: "Công Cụ Chấm Điểm Nhanh 1-1 (Quick Score)",
    subtitle: "Đối chiếu ma trận tức thì giữa 1 văn bản JD và 1 bản CV đơn lẻ",
  },
  "interview-hub": {
    title: "Trung Tâm Lịch Phỏng Vấn & Email Tuyển Dụng",
    subtitle: "Quản lý lịch hẹn phỏng vấn, phòng họp Google Meet / Zoom và nhật ký gửi email ứng viên",
  },
  "interview-gen": {
    title: "Bộ Câu Hỏi Phỏng Vấn AI (AI Interview Generator)",
    subtitle: "Tự động sinh câu hỏi kỹ thuật, tình huống kèm thang điểm chuẩn cho người phỏng vấn",
  },
  "salary-benchmark": {
    title: "Tra Cứu Mức Lương Thị Trường Việt Nam 2026",
    subtitle: "Dữ liệu thống kê mức lương thực tế đa ngành nghề theo vị trí, khu vực và kinh nghiệm tại Việt Nam",
  },
  "contact-candidates": {
    title: "Liên Hệ & Gửi Email Ứng Viên Hàng Loạt",
    subtitle: "Tự động hóa gửi thư mời phỏng vấn, thư offer và thư cảm ơn với biến cá nhân hóa",
  },
  history: {
    title: "Lịch Sử & Kho Lưu Trữ Đợt Tuyển Dụng",
    subtitle: "Xem lại kết quả các đợt đối chiếu trước, tải lại bảng điểm và xuất báo cáo CSV",
  },
  reports: {
    title: "Báo Cáo Dữ Liệu Theo Từng Phiên Lọc Hồ Sơ",
    subtitle: "Thống kê chi tiết kết quả chấm điểm AI, ma trận rubric 6 tiêu chí và xuất file CSV theo từng phiên lọc CV",
  },
  settings: {
    title: "Thông Tin Người Dùng & Cài Đặt Hệ Thống",
    subtitle: "Quản lý định danh chuyên viên, địa điểm văn phòng làm việc, múi giờ hoạt động và bảo mật Google Cloud",
  },
  "criteria-settings": {
    title: "Tiêu Chí Chấm Điểm & Bộ Lọc JD (Rubric Engine)",
    subtitle: "Cấu hình 6 trọng số Rubric AI và bộ lọc điều kiện cứng tự động áp dụng cho các đợt lọc CV",
  },
};

export function Header() {
  const {
    activeSection,
    setActiveSection,
    setMobileMenuOpen,
    setIsSearchOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    userProfile,
    authUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    logoutUser,
  } = useSalesOps();

  const [quickCandidateModalOpen, setQuickCandidateModalOpen] = useState(false);
  const rawPathname = usePathname();

  // Firebase auth resolves client-only and its cached session can restore
  // faster than React's hydration check completes; `usePathname()` also isn't
  // guaranteed to match between the statically-built HTML and the client's
  // real URL on first paint. Gate both behind `mounted` so the very first
  // client render always matches the server byte-for-byte — real values swap
  // in on the next render once mounted, same as any normal post-hydration
  // update. This also keeps the DOM shape stable on first paint so it doesn't
  // shift the sequence Radix assigns via useId() to popovers/menus later in
  // the tree.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = mounted ? rawPathname : null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  // match-workflow là route riêng dưới /dashboard nên không còn đi qua
  // setActiveSection — phải suy tiêu đề từ pathname trước. chatbot và
  // salary-benchmark đã tách hẳn khỏi khung này (có top bar riêng ở
  // app/chatbot, app/salary-benchmark) nên Header không cần biết tới nữa.
  const routeSection: Section | null = pathname === "/dashboard/match-workflow" ? "match-workflow" : null;
  const currentSectionInfo = sectionTitles[routeSection ?? activeSection] || {
    title: "CV Match",
    subtitle: "Nền tảng Tuyển dụng & Chấm điểm CV Thông minh",
  };

  const activeEmail = mounted ? authUser?.email || userProfile.email : userProfile.email;
  const activeName = mounted ? authUser?.displayName || userProfile.name : userProfile.name;
  const activeAvatarInitial = (activeName || activeEmail || "U")[0].toUpperCase();

  return (
    <>
      <header className="h-16 border-b border-border bg-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
        {/* Left Side: Mobile Menu + Clean Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">
              {currentSectionInfo.title}
            </h1>
            <p className="hidden md:block text-xs text-muted-foreground line-clamp-1">
              {currentSectionInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Global Search + Notifications + User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Global Search Bar Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-muted-foreground hover:text-slate-900 hover:border-sky-300 transition-all duration-200"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Tìm kiếm...</span>
            <kbd className="hidden sm:inline-block text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
              Ctrl+K
            </kbd>
          </button>

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-sky-50 transition-all duration-200">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-sky-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 sm:w-96 p-0 shadow-xl border-border bg-white">
              <div className="flex items-center justify-between p-3.5 border-b border-border bg-sky-50/40">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Thông Báo Tuyển Dụng</span>
                  {unreadCount > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                      {unreadCount} mới
                    </Badge>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-sky-600 hover:underline font-semibold"
                    >
                      Đã đọc tất cả
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      onClick={clearNotifications}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Dọn dẹp
                    </button>
                  </div>
                )}
              </div>

              <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs">
                    Hiện chưa có thông báo mới.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.sectionTarget) {
                          setActiveSection(n.sectionTarget as Section);
                        }
                      }}
                      className={`p-3.5 hover:bg-sky-50/50 cursor-pointer transition-colors flex items-start gap-3 ${
                        !n.read ? "bg-sky-50/20" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type === "candidate"
                            ? "bg-sky-100 text-sky-700"
                            : n.type === "interview"
                            ? "bg-blue-100 text-blue-700"
                            : n.type === "risk"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-sky-600 mt-2 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* User Profile Avatar Chip */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 pl-2.5 rounded-full bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 transition-all duration-200 group">
                <span className="hidden md:inline-block text-xs font-semibold text-slate-800 max-w-[150px] truncate">
                  {activeEmail}
                </span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                  {authUser?.photoURL ? (
                    <img src={authUser.photoURL} alt={activeName} className="w-full h-full object-cover" />
                  ) : (
                    activeAvatarInitial
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 shadow-xl border-border bg-white">
              <DropdownMenuLabel
                onClick={() => setActiveSection("settings")}
                className="font-normal cursor-pointer hover:bg-sky-50/60 transition-colors rounded-lg p-2"
              >
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span>{activeName}</span>
                    <span className="text-[10px] text-sky-600 font-semibold">Xem Hồ Sơ →</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeEmail}
                  </p>
                  <Badge variant="outline" className="w-fit text-[10px] mt-1 bg-sky-50 text-sky-700 border-sky-200">
                    {authUser ? "Đã Xác Thực" : "Tài Khoản Tuyển Dụng"}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsAuthModalOpen(true)}
                className="cursor-pointer text-xs font-semibold text-sky-600 focus:text-sky-700 focus:bg-sky-50"
              >
                <Key className="w-4 h-4 mr-2 text-sky-600" />
                <span>{authUser ? "Quản Lý Tài Khoản" : "Đăng Nhập Tài Khoản"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveSection("settings")}
                className="cursor-pointer text-xs font-medium focus:bg-sky-50 focus:text-sky-700"
              >
                <User className="w-4 h-4 mr-2 text-sky-600" />
                <span>Hồ Sơ & Cài Đặt</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveSection("criteria-settings")}
                className="cursor-pointer text-xs font-medium focus:bg-sky-50 focus:text-sky-700"
              >
                <Sliders className="w-4 h-4 mr-2 text-sky-600" />
                <span>Tiêu Chí Chấm Điểm JD</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logoutUser}
                className="cursor-pointer text-xs text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Đăng Xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Quick Candidate Modal */}
      <CandidateModal
        open={quickCandidateModalOpen}
        onOpenChange={setQuickCandidateModalOpen}
      />

      {/* Firebase Auth & Real Database Modal */}
      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />
    </>
  );
}
