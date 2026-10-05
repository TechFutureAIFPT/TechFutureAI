"use client";

import { useSalesOps } from "@/lib/sales-ops-context";
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart";
import { PipelineOverview } from "@/components/dashboard/charts/pipeline-overview";
import { RecentDeals } from "@/components/dashboard/recent-deals";
import { RecentSessionsReport } from "@/components/dashboard/recent-sessions";
import {
  Users,
  Briefcase,
  Sparkles,
  Layers,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

export function OverviewSection() {
  const { metrics, historyBatches, setActiveSection } = useSalesOps();

  const kpis = [
    {
      title: "Tổng Hồ Sơ Đã Xử Lý",
      value: `${metrics.totalCandidates}`,
      subtext: `+24% so với tháng trước`,
      icon: Users,
      trend: "+24.5%",
      trendUp: true,
      onClick: () => setActiveSection("candidates"),
      accent: "text-sky-600 bg-sky-50 border border-sky-100",
    },
    {
      title: "Điểm Match AI Trung Bình",
      value: `${metrics.avgMatchScore}%`,
      subtext: `${metrics.qualifiedCount} hồ sơ đạt chuẩn (≥ 75%)`,
      icon: Sparkles,
      trend: "+4.2%",
      trendUp: true,
      onClick: () => setActiveSection("pipeline"),
      accent: "text-blue-600 bg-blue-50 border border-blue-100",
    },
    {
      title: "Vị Trí Đang Tuyển Dụng",
      value: `${metrics.activeJobsCount} JD`,
      subtext: `Tổng chỉ tiêu: ${metrics.totalOpenings} nhân sự`,
      icon: Briefcase,
      trend: `${metrics.totalOpenings} chỉ tiêu`,
      trendUp: true,
      onClick: () => setActiveSection("jobs"),
      accent: "text-cyan-600 bg-cyan-50 border border-cyan-100",
    },
    {
      title: "Phiên Lọc & Báo Cáo Đã Lưu",
      value: `${historyBatches.length} Đợt Tuyển`,
      subtext: `Sẵn sàng xuất file CSV & bảng điểm`,
      icon: Layers,
      trend: `${historyBatches.length} phiên`,
      trendUp: true,
      onClick: () => setActiveSection("reports"),
      accent: "text-indigo-600 bg-indigo-50 border border-indigo-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              onClick={kpi.onClick}
              className="bg-card border border-border rounded-xl p-5 hover:border-sky-300 cursor-pointer transition-all duration-300 shadow-xs group animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  <TrendingUp className="w-3 h-3 text-sky-600" />
                  {kpi.trend}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{kpi.title}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                {kpi.value}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                <span>{kpi.subtext}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sky-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div className="lg:col-span-1">
          <PipelineOverview />
        </div>
      </div>

      {/* Real-time Operation Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentDeals />
        <RecentSessionsReport />
      </div>
    </div>
  );
}
