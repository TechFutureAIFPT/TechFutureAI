"use client";

import { SalesOpsProvider } from "@/lib/sales-ops-context";
import { AIAssistantSection } from "@/components/dashboard/features/ai-tools";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AIAssistantPage() {
  return (
    <SalesOpsProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Top App Header */}
        <header className="h-12 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              aria-label="Về không gian làm việc"
              title="Về không gian làm việc"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold text-slate-900">
                SupportHR AI Assistant
              </span>
            </div>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Tuyển Dụng & Deep Research (Port 8080)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/career-compass"
              className="text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg font-medium transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <span>🧭 Chuyển sang Cố vấn Hướng nghiệp</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Bàn làm việc
            </Link>
          </div>
        </header>

        {/* Khung chức năng AI Assistant */}
        <div className="flex-1 overflow-hidden">
          <AIAssistantSection />
        </div>
      </div>
    </SalesOpsProvider>
  );
}
