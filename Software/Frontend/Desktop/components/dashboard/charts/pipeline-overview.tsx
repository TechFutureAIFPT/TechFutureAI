"use client";

import { useSalesOps } from "@/lib/sales-ops-context";
import { type Candidate } from "@/lib/mock-data";
import { Sparkles, ArrowRight } from "lucide-react";

const stagesConfig: {
  key: Candidate["stage"];
  name: string;
  color: string;
}[] = [
  { key: "screening", name: "1. Sơ loại CV (Screening)", color: "#0284c7" },
  { key: "qualified", name: "2. Đạt chuẩn (≥ 75%)", color: "#0ea5e9" },
  { key: "interview", name: "3. Vòng phỏng vấn (Interview)", color: "#38bdf8" },
  { key: "offer", name: "4. Đề nghị nhận việc (Offer)", color: "#0369a1" },
];

export function PipelineOverview() {
  const { candidates, setActiveSection } = useSalesOps();

  const total = candidates.length || 1;

  const stageData = stagesConfig.map((stage) => {
    const matching = candidates.filter((c) => c.stage === stage.key);
    const count = matching.length;
    const percentage = Math.round((count / total) * 100);

    return {
      ...stage,
      count,
      percentage,
    };
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-[380px] flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 shadow-xs">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Phân Bổ Phễu Ứng Viên</h3>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-sky-100">
              <Sparkles className="w-3 h-3 text-sky-600" />
              AI Pipeline
            </span>
          </div>
          <button
            onClick={() => setActiveSection("pipeline")}
            className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Mở Kanban &rarr;
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Tỉ lệ chuyển đổi qua các giai đoạn trong quy trình tuyển dụng
        </p>

        {/* Stacked Progress Bar */}
        <div className="w-full h-3 bg-sky-50 rounded-full overflow-hidden flex mb-5 border border-sky-100">
          {stageData.map((stage) => (
            <div
              key={stage.key}
              style={{
                width: `${stage.percentage}%`,
                backgroundColor: stage.color,
              }}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              title={`${stage.name}: ${stage.count} ứng viên (${stage.percentage}%)`}
            />
          ))}
        </div>

        {/* Stage List */}
        <div className="space-y-3">
          {stageData.map((stage) => (
            <div
              key={stage.key}
              onClick={() => setActiveSection("pipeline")}
              className="group flex items-center justify-between p-2 rounded-lg hover:bg-sky-50/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="text-xs font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">
                  {stage.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {stage.count} ứng viên
                </span>
                <span className="text-xs font-bold text-slate-900 w-8 text-right">
                  {stage.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Tổng số hồ sơ đang vận hành</span>
        <span className="font-bold text-slate-900 text-sm">
          {candidates.length} Ứng viên
        </span>
      </div>
    </div>
  );
}
