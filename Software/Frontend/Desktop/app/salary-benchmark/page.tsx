"use client";

import { SalesOpsProvider } from "@/lib/sales-ops-context";
import { SalaryBenchmarkSection } from "@/components/dashboard/features/ai-tools";
import { ArrowLeft } from "lucide-react";

export default function SalaryBenchmarkPage() {
  return (
    <SalesOpsProvider>
      <div className="min-h-screen bg-slate-50/60">
        {/* Top bar tối giản, đồng bộ với /chatbot — nhường trọng tâm thị giác
            cho khung tra cứu gradient sẵn có bên trong SalaryBenchmarkSection
            thay vì lặp thêm 1 lớp tiêu đề nữa. */}
        <header className="h-12 shrink-0 flex items-center gap-2 px-4 sm:px-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <a
            href="/dashboard"
            aria-label="Về không gian làm việc"
            title="Về không gian làm việc"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <img src="/brand/cvmatch-icon.png" alt="" className="w-5 h-5 rounded" />
          <span className="text-sm font-semibold text-slate-800">Tra Cứu Mức Lương Thị Trường</span>
        </header>

        <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
          <SalaryBenchmarkSection />
        </div>
      </div>
    </SalesOpsProvider>
  );
}
