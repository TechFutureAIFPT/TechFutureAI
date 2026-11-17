"use client";

import { SalesOpsProvider, useSalesOps, type Section } from "@/lib/sales-ops-context";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { CommandSearch } from "@/components/dashboard/command-search";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";

function PreviewNotice() {
  const { authUser, authChecked, workspaceDataState, reloadRealUserData, setIsAuthModalOpen } = useSalesOps();
  if (!authChecked) return null;
  if (workspaceDataState === "loading") return <div role="status" className="service-note">Đang tải dữ liệu tài khoản…</div>;
  if (workspaceDataState === "error") return <div role="alert" className="service-note flex flex-wrap items-center justify-between gap-2"><span><strong>Chưa đồng bộ được dữ liệu.</strong><span className="max-md:hidden"> Các thay đổi sẽ không được báo đã lưu cho đến khi máy chủ phản hồi.</span></span><button className="font-semibold text-primary" onClick={() => void reloadRealUserData()}>Thử tải lại</button></div>;
  if (authUser) return null;
  return <div className="service-note service-note-preview flex flex-wrap items-center justify-between gap-2"><span><strong>Dữ liệu minh họa.</strong><span className="max-md:hidden"> Thay đổi trong chế độ xem trước chỉ tồn tại đến khi bạn rời phiên này.</span></span><button className="font-semibold text-primary" onClick={() => setIsAuthModalOpen(true)}><span className="max-md:hidden">Đăng nhập để lưu dữ liệu</span><span className="md:hidden">Đăng nhập để lưu</span></button></div>;
}

function ApplicationFrame({ children, fullBleed = false }: { children: React.ReactNode; fullBleed?: boolean }) {
  const { activeSection } = useSalesOps();
  const immersive = fullBleed || ["ai-assistant", "chatbot", "career-compass"].includes(activeSection);
  return <div className={immersive ? "enterprise-app is-immersive" : "enterprise-app"}>
    <a href="#workspace-content" className="skip-link">Chuyển đến nội dung</a>
    <Sidebar />
    <div className="app-frame"><Header />
      <main id="workspace-content" tabIndex={-1} className={immersive ? "app-content app-content-full" : "app-content"}>{!immersive && <PreviewNotice />}{children}</main>
    </div><MobileTabBar /><CommandSearch />
  </div>;
}

export function ApplicationShell({ children, fullBleed = false, initialSection = "overview" }: { children: React.ReactNode; fullBleed?: boolean; initialSection?: Section }) {
  return <SalesOpsProvider initialSection={initialSection}><ApplicationFrame fullBleed={fullBleed}>{children}</ApplicationFrame></SalesOpsProvider>;
}
