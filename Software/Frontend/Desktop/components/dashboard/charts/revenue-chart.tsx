"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { monthlyRecruitmentTrend, quarterlyRecruitmentTrend } from "@/lib/mock-data";
import { TrendingUp, Sparkles } from "lucide-react";

export function RevenueChart() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [period, setPeriod] = useState<"monthly" | "quarterly">("monthly");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 250);
    return () => clearTimeout(timer);
  }, []);

  const chartData = period === "monthly" ? monthlyRecruitmentTrend : quarterlyRecruitmentTrend;
  const xKey = period === "monthly" ? "month" : "quarter";

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Tốc Độ Xử Lý & Chấm Điểm CV</h3>
            <span className="flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
              <TrendingUp className="w-3 h-3 text-sky-600" />
              +24.5% So cùng kỳ
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Số lượng hồ sơ CV phân tích tự động so với chỉ tiêu tuyển dụng
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <button
              onClick={() => setPeriod("monthly")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                period === "monthly"
                  ? "bg-white text-sky-700 font-bold shadow-xs border border-sky-100"
                  : "text-muted-foreground hover:text-slate-900"
              }`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setPeriod("quarterly")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                period === "quarterly"
                  ? "bg-white text-sky-700 font-bold shadow-xs border border-sky-100"
                  : "text-muted-foreground hover:text-slate-900"
              }`}
            >
              Theo Quý
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              <span className="text-muted-foreground">CV đã phân tích</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Chỉ tiêu</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`h-[270px] transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="candGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value) => `${value} CV`}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #bae6fd",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#0f172a",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              formatter={(value: number, name: string) => [
                `${value} Hồ sơ`,
                name === "candidates" || name === "applicants" ? "CV Đã Xử Lý" : "Chỉ Tiêu",
              ]}
            />
            <Area
              type="monotone"
              dataKey="target"
              name="Chỉ tiêu"
              stroke="#38bdf8"
              strokeWidth={2}
              fill="url(#targetGradient)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey={period === "monthly" ? "candidates" : "applicants"}
              name="CV Phân tích"
              stroke="#0284c7"
              strokeWidth={2.5}
              fill="url(#candGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
