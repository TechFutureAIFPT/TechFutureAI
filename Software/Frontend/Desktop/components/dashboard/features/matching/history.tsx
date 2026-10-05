"use client";

import { useState } from "react";
import { useSalesOps } from "@/lib/sales-ops-context";
import { type HistoryBatch } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Search,
  Download,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  User,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export function HistorySection() {
  const {
    historyBatches,
    exportBatchReportCsv,
    setActiveSection,
    setWorkflowStep,
    setWorkflowJD,
  } = useSalesOps();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<HistoryBatch | null>(
    historyBatches[0] || null
  );

  const filtered = historyBatches.filter(
    (b) =>
      b.batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.recruiter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReloadBatch = (batch: HistoryBatch) => {
    setWorkflowJD({
      title: batch.jobTitle,
      content: `Chiến dịch tuyển dụng: ${batch.batchName}\nVị trí: ${batch.jobTitle}`,
      requirements: [
        "Yêu cầu chuyên môn theo tiêu chuẩn đợt tuyển",
        "Kinh nghiệm thực chiến trong các dự án tương đương",
      ],
    });
    setWorkflowStep(5);
    setActiveSection("match-workflow");
    toast.success(`Đã nạp lại kết quả đợt tuyển "${batch.batchName}" vào luồng đối chiếu!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <Badge className="bg-secondary text-foreground text-xs font-semibold">
          {historyBatches.length} Đợt Tuyển Dụng Lưu Trữ
        </Badge>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm đợt tuyển, vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-border text-xs h-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batches List Column */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((batch) => {
            const isSelected = selectedBatch?.id === batch.id;

            return (
              <Card
                key={batch.id}
                onClick={() => setSelectedBatch(batch)}
                className={`cursor-pointer transition-all duration-200 shadow-xs ${
                  isSelected
                    ? "border-sky-400 bg-sky-50/40 shadow-2xs"
                    : "border-border bg-card hover:border-sky-300"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 hover:text-sky-600 transition-colors">
                          {batch.batchName}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Vị trí: <span className="text-slate-900 font-medium">{batch.jobTitle}</span>
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                          <span>Phụ trách: {batch.recruiter}</span>
                          <span>•</span>
                          <span>{batch.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold"
                    >
                      Hoàn Tất
                    </Badge>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-sky-50/30 border border-sky-100 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Tổng hồ sơ</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">
                        {batch.totalCVs} CV
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Đạt chuẩn (≥ 75%)</span>
                      <span className="font-bold text-sky-700 mt-0.5 block">
                        {batch.qualifiedCount} ứng viên
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Điểm Match TB</span>
                      <span className="font-bold text-sky-700 mt-0.5 block">
                        {batch.avgScore}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground">
                      Top 1: <strong className="text-slate-900">{batch.topCandidateName}</strong> ({batch.topScore}%)
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportBatchReportCsv(batch.id);
                        }}
                        className="h-7 text-xs border-border hover:bg-sky-50 hover:text-sky-700"
                      >
                        <Download className="w-3 h-3 mr-1 text-sky-600" />
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReloadBatch(batch);
                        }}
                        className="h-7 text-xs bg-sky-600 text-white hover:bg-sky-700 shadow-xs font-bold"
                      >
                        Mở Đợt Này &rarr;
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected Batch Details Sidecard */}
        <div>
          {selectedBatch ? (
            <Card className="border-border bg-card shadow-xs sticky top-20">
              <CardHeader className="pb-3 border-b border-border bg-sky-50/40">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Chi Tiết Đợt Tuyển Dụng
                </CardTitle>
                <CardDescription className="text-xs truncate">
                  {selectedBatch.batchName}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Mã Đợt:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedBatch.id}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Vị Trí JD:</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px]">
                      {selectedBatch.jobTitle}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Ngày Phân Tích:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedBatch.createdAt}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Recruiter Phụ Trách:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedBatch.recruiter}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Tỉ Lệ Đạt Chuẩn:</span>
                    <span className="font-bold text-sky-700">
                      {Math.round((selectedBatch.qualifiedCount / (selectedBatch.totalCVs || 1)) * 100)}%
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleReloadBatch(selectedBatch)}
                  className="w-full bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Tải Lại Kết Quả Lên Bảng Điểm
                </Button>

                <Button
                  variant="outline"
                  onClick={() => exportBatchReportCsv(selectedBatch.id)}
                  className="w-full border-border text-xs hover:bg-sky-50 hover:text-sky-700"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                  Xuất Toàn Bộ Bảng Điểm CSV
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground bg-slate-50 rounded-xl border border-border">
              Chọn một đợt tuyển dụng bên trái để xem chi tiết
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
