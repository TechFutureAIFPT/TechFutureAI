"use client";

import { SalesOpsProvider } from "@/lib/sales-ops-context";
import { CareerCompassSection } from "@/components/dashboard/features/ai-tools";
import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

export default function CareerCompassPage() {
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
              <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold text-slate-900">
                Career Compass • Cố Vấn Định Hướng Nghề Nghiệp
              </span>
            </div>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              DeepSeek Reasoner & Holland RIASEC (Port 8001)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ai-assistant"
              className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg font-medium transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <span>✨ Chuyển sang Trợ lý Tuyển dụng AI</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Bàn làm việc
            </Link>
          </div>
        </header>

        {/* Khung chức năng Career Compass */}
        <div className="flex-1 overflow-hidden">
          <CareerCompassSection />
        </div>
      </div>
    </SalesOpsProvider>
  );
}
