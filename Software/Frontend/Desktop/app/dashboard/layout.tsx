"use client";

/**
 * Shell dùng chung cho toàn bộ /dashboard/* — Sidebar, Header, CommandSearch
 * và SalesOpsProvider chỉ dựng một lần ở đây, không remount khi chuyển giữa
 * các trang con (/dashboard, /dashboard/match-workflow…) — giữ nguyên trạng
 * thái phiên khi điều hướng. chatbot và salary-benchmark KHÔNG dùng layout
 * này — đã tách hẳn thành route gốc riêng (/chatbot, /salary-benchmark) với
 * top bar tối giản riêng, không có Sidebar/Header của dashboard.
 */
import { SalesOpsProvider } from "@/lib/sales-ops-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { CommandSearch } from "@/components/dashboard/command-search";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SalesOpsProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col transition-all duration-300 ease-out min-w-0 md:ml-[260px]">
          <Header />
          <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
        </div>
        <CommandSearch />
      </div>
    </SalesOpsProvider>
  );
}
