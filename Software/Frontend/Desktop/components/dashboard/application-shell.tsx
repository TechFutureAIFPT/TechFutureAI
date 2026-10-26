"use client";

import { SalesOpsProvider, useSalesOps } from "@/lib/sales-ops-context";
import { Header } from "@/components/dashboard/header";
import { CommandSearch } from "@/components/dashboard/command-search";
import { usePathname } from "next/navigation";

function PreviewNotice() {
  const { authUser, authChecked, setIsAuthModalOpen } = useSalesOps();
  if (!authChecked || authUser) return null;
  return <div className="service-note flex flex-wrap items-center justify-between gap-2"><span><strong>Chế độ xem trước.</strong> Hồ sơ và số liệu mẫu giúp bạn khám phá công cụ. Đăng nhập để làm việc với dữ liệu của bạn.</span><button className="font-semibold text-primary" onClick={() => setIsAuthModalOpen(true)}>Đăng nhập</button></div>;
}

function ApplicationFrame({ children, fullBleed = false }: { children: React.ReactNode; fullBleed?: boolean }) {
  const { activeSection } = useSalesOps();
  const pathname = usePathname();
  const immersive = fullBleed || (pathname === "/dashboard" && ["ai-assistant", "chatbot", "career-compass"].includes(activeSection));
  return <div className="enterprise-app tools-layout">
    <a href="#workspace-content" className="skip-link">Chuyển đến nội dung</a>
    <div className="app-frame"><Header />
      <main id="workspace-content" tabIndex={-1} className={immersive ? "app-content app-content-full" : "app-content"}>{!immersive && <PreviewNotice />}{children}</main>
    </div><CommandSearch />
  </div>;
}

export function ApplicationShell({ children, fullBleed = false }: { children: React.ReactNode; fullBleed?: boolean }) {
  return <SalesOpsProvider><ApplicationFrame fullBleed={fullBleed}>{children}</ApplicationFrame></SalesOpsProvider>;
}
