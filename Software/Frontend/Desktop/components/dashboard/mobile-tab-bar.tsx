"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Files, LayoutDashboard, LayoutGrid, Users, type LucideIcon } from "lucide-react";
import { canonicalSection } from "@/lib/navigation";
import { useSalesOps, type Section } from "@/lib/sales-ops-context";
import { cn } from "@/lib/utils";

interface MobileTab {
  id: Section;
  label: string;
  href: string;
  icon: LucideIcon;
}

const mobileTabs: MobileTab[] = [
  { id: "overview", label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { id: "match-workflow", label: "CV Match", href: "/cv-match", icon: Files },
  { id: "candidates", label: "Ứng viên", href: "/dashboard?section=candidates", icon: Users },
  { id: "ai-assistant", label: "Trợ lý AI", href: "/ai-assistant", icon: Bot },
];

export function MobileTabBar() {
  const { activeSection, mobileMenuOpen, setMobileMenuOpen } = useSalesOps();
  const rawPathname = usePathname();
  // Giữ lần render đầu trên client trùng khớp HTML dựng sẵn (không tô sáng tab nào)
  // để tránh lệch hydrate, giống cách Header/Sidebar đang làm.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = mounted ? rawPathname : null;
  const current = canonicalSection(activeSection);

  const isTabActive = (tab: MobileTab) => {
    if (!pathname) return false;
    if (tab.href.startsWith("/dashboard")) return pathname === "/dashboard" && current === tab.id;
    return pathname === tab.href;
  };

  // "Thêm" sáng khi sheet đang mở hoặc khi trang hiện tại không thuộc 4 tab chính
  // (vd. Lịch phỏng vấn, Báo cáo, Career Match...).
  const moreActive = mobileMenuOpen || (pathname !== null && !mobileTabs.some(isTabActive));

  return (
    <nav className="mobile-tabbar" aria-label="Điều hướng nhanh">
      {mobileTabs.map((tab) => {
        const active = !mobileMenuOpen && isTabActive(tab);
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn("mobile-tab", active && "is-active")}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="mobile-tab-icon"><tab.icon size={21} strokeWidth={active ? 2.1 : 1.7} /></span>
            <span className="mobile-tab-label">{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className={cn("mobile-tab", moreActive && "is-active")}
        aria-label="Mở tất cả tính năng"
        aria-controls="application-navigation"
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <span className="mobile-tab-icon"><LayoutGrid size={21} strokeWidth={moreActive ? 2.1 : 1.7} /></span>
        <span className="mobile-tab-label">Thêm</span>
      </button>
    </nav>
  );
}
