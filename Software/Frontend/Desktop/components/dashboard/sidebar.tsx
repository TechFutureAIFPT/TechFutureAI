"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSalesOps, type Section } from "@/lib/sales-ops-context";
import {
  LayoutDashboard,
  Briefcase,
  GitBranch,
  Users,
  Sparkles,
  Zap,
  MessageSquare,
  HelpCircle,
  DollarSign,
  Mail,
  Clock,
  UserCheck,
  TrendingUp,
  BarChart3,
  X,
  Layers,
  CalendarDays,
} from "lucide-react";

interface NavGroup {
  label: string;
  items: { id: Section; label: string; icon: React.ElementType; badge?: string; href?: string }[];
}

// Thứ tự nhóm và mục theo đúng luồng làm việc thực tế của recruiter: mở app
// thấy tổng quan trước tiên -> vào quy trình lọc CV cốt lõi -> dùng công cụ
// AI hỗ trợ -> cuối cùng mới tới báo cáo/tổng kết. Tổng quan là trang mặc
// định khi mở app (activeSection ban đầu là "overview") nên phải ở trên đầu,
// không phải nằm cuối như trước.
const navGroups: NavGroup[] = [
  {
    label: "TỔNG QUAN",
    items: [
      { id: "overview", label: "Tổng Quan Tuyển Dụng", icon: LayoutDashboard },
    ],
  },
  {
    label: "LỌC HỒ SƠ & ĐỐI CHIẾU (CORE)",
    items: [
      { id: "workspace", label: "Không Gian Làm Việc", icon: Layers, badge: "Hub" },
      { id: "match-workflow", label: "Quy Trình Đối Chiếu AI", icon: Sparkles, badge: "5 Bước", href: "/dashboard/match-workflow" },
      { id: "candidates", label: "Kho Hồ Sơ Ứng Viên", icon: Users },
      { id: "jobs", label: "Vị Trí Tuyển Dụng (JD)", icon: Briefcase },
      { id: "history", label: "Lịch Sử Đợt Lọc CV", icon: Clock },
    ],
  },
  {
    label: "CÔNG CỤ & TIỆN ÍCH AI",
    items: [
      { id: "chatbot", label: "Trợ Lý AI", icon: MessageSquare, badge: "Chat", href: "/chatbot" },
      { id: "interview-gen", label: "Bộ Câu Hỏi Phỏng Vấn", icon: HelpCircle, href: "/interview-questions" },
      { id: "interview-hub", label: "Lịch PV & Hộp Thư Email", icon: CalendarDays, badge: "Mới" },
      { id: "salary-benchmark", label: "Tra Cứu Thị Trường Lương", icon: DollarSign, href: "/salary-benchmark" },
      { id: "contact-candidates", label: "Liên Hệ Ứng Viên", icon: Mail },
    ],
  },
  {
    label: "QUẢN TRỊ & BÁO CÁO",
    items: [
      { id: "reports", label: "Báo Cáo Phiên Lọc & Xuất File", icon: BarChart3, badge: "CSV" },
    ],
  },
];

export function Sidebar() {
  const {
    activeSection,
    setActiveSection,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useSalesOps();
  // `usePathname()` không đảm bảo khớp tuyệt đối giữa HTML tĩnh dựng sẵn lúc
  // build và lần render đầu của client — chặn việc tô sáng mục đang active
  // theo route tới sau khi mount để lần vẽ đầu tiên trên client luôn giống hệt
  // server, tránh lệch DOM kéo theo lệch số thứ tự useId() của Radix phía sau.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const rawPathname = usePathname();
  const pathname = mounted ? rawPathname : null;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-[260px] bg-white border-r border-sidebar-border transition-transform duration-300 ease-out flex flex-col shadow-xl md:shadow-none",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header with Official CV Match Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0 bg-white">
          <a
            href="/dashboard"
            onClick={() => setActiveSection("overview")}
            className="flex items-center gap-3 overflow-hidden cursor-pointer group"
          >
            {/* CV Match Brand Icon */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-secondary/80 border border-border/80 group-hover:scale-105 transition-transform overflow-hidden p-1">
              <img
                src="/brand/cvmatch-icon.png"
                alt="CV Match Icon"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            <div className="overflow-hidden whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  CV MATCH
                </span>
                <span className="px-1.5 py-0.2 bg-sky-100 text-sky-700 text-[9px] font-bold rounded">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Support HR Platform
              </p>
            </div>
          </a>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-slate-900 hover:bg-sky-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto overflow-x-hidden bg-white">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.label}
              </p>

              {group.items.map((item) => {
                const Icon = item.icon;
                // Mục có `href` là route riêng (điều hướng thật); mục còn lại
                // vẫn chuyển bằng activeSection nội bộ trong /dashboard.
                const isActive = item.href
                  ? pathname === item.href
                  : pathname === "/dashboard" && activeSection === item.id;

                const content = (
                  <>
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-sky-600" : "text-slate-400 group-hover:text-sky-600"
                      )}
                    />

                    <span className="truncate">{item.label}</span>

                    {item.badge && (
                      <span
                        className={cn(
                          "ml-auto text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0",
                          isActive
                            ? "bg-sky-600 text-white"
                            : "bg-sky-50 text-sky-700"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                );

                const itemClassName = cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-sky-50 text-sky-700 font-bold shadow-2xs border border-sky-200"
                    : "text-slate-600 hover:text-sky-900 hover:bg-sky-50/50"
                );

                if (item.href) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={itemClassName}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={itemClassName}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
