"use client";

import { useSalesOps } from "@/lib/sales-ops-context";
import { Layers, Download, Sparkles, ArrowRight, CheckCircle2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RecentSessionsReport() {
  const { historyBatches, exportBatchReportCsv, setActiveSection } = useSalesOps();

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Báo Cáo Các Phiên Lọc Hồ Sơ Gần Nhất
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dữ liệu đối chiếu AI, số lượng CV và xuất báo cáo CSV theo từng phiên lọc
          </p>
        </div>
        <button
          onClick={() => setActiveSection("reports")}
          className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
        >
          Xem tất cả báo cáo &rarr;
        </button>
      </div>

      <div className="space-y-3">
        {historyBatches.slice(0, 4).map((batch, idx) => {
          return (
            <div
              key={`${batch.id}-${idx}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50/60 hover:bg-sky-50/50 border border-slate-200/80 hover:border-sky-300 transition-all duration-200 gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {batch.batchName}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                    {batch.jobTitle}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-sky-600" />
                      {batch.createdAt}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      {batch.totalCVs} CV đã lọc
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {batch.qualifiedCount} Đạt chuẩn
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <div className="text-right mr-1 hidden sm:block">
                  <div className="flex items-center gap-1 justify-end">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span className="text-sm font-bold text-slate-900">
                      {batch.avgScore}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Điểm TB phiên</p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportBatchReportCsv(batch.id)}
                  className="h-8 px-2.5 bg-white border-slate-200 hover:bg-sky-50 hover:text-sky-700 text-xs font-semibold"
                  title="Xuất file CSV báo cáo phiên lọc này"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-sky-600" />
                  <span>Xuất CSV</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
