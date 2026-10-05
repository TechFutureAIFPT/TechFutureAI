"use client";

import { useSalesOps } from "@/lib/sales-ops-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
  Layers,
  FileText,
  Upload,
  Sliders,
  DollarSign,
  MessageSquare,
  HelpCircle,
  Users,
  ChevronRight,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

export function WorkspaceSection() {
  const {
    setActiveSection,
    historyBatches,
    metrics,
    jobs,
    setWorkflowStep,
  } = useSalesOps();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-transparent border border-sky-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-sky-600 text-white font-bold text-xs">
                CV Match Workspace
              </Badge>
              <span className="text-xs text-muted-foreground">Support HR AI Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Chào Mừng Bạn Đến Với Không Gian Tuyển Dụng AI
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Hệ thống tự động hóa đối chiếu hồ sơ CV với mô tả công việc (JD), sinh câu hỏi phỏng vấn và xếp hạng ứng viên dựa trên mô hình học sâu.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => {
              setWorkflowStep(1);
              setActiveSection("match-workflow");
            }}
            className="bg-sky-600 text-white hover:bg-sky-700 font-bold shadow-xs shrink-0 text-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Bắt Đầu Đợt Đối Chiếu Mới
          </Button>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
          Công Cụ & Lối Tắt Nhanh
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Quy Trình Đối Chiếu AI",
              desc: "Luồng 5 bước: Nhập JD, Tải CV, Thiết lập Trọng số, Chấm điểm và Radar so sánh",
              icon: Sparkles,
              badge: "Cốt lõi",
              action: () => {
                setWorkflowStep(1);
                setActiveSection("match-workflow");
              },
              color: "text-sky-600 bg-sky-50 border-sky-200",
            },
            {
              title: "Bộ Câu Hỏi Phỏng Vấn AI",
              desc: "Tự động sinh bộ câu hỏi kỹ thuật, tình huống và thang điểm rubric cho ứng viên",
              icon: HelpCircle,
              badge: "Phỏng vấn",
              action: () => setActiveSection("interview-gen"),
              color: "text-blue-600 bg-blue-50 border-blue-200",
            },
            {
              title: "Trợ Lý AI Tuyển Dụng",
              desc: "Chatbot thông minh giải đáp, so sánh hồ sơ và gợi ý câu hỏi phỏng vấn",
              icon: MessageSquare,
              badge: "AI Chat",
              action: () => setActiveSection("chatbot"),
              color: "text-cyan-600 bg-cyan-50 border-cyan-200",
            },
            {
              title: "Lịch PV & Hộp Thư Email",
              desc: "Quản lý lịch hẹn phỏng vấn, Google Meet / Zoom và nhật ký gửi email ứng viên",
              icon: CalendarDays,
              badge: "Mới",
              action: () => setActiveSection("interview-hub"),
              color: "text-emerald-600 bg-emerald-50 border-emerald-200",
            },
            {
              title: "Khảo Sát Thị Trường Lương",
              desc: "Tra cứu dải lương thị trường 2026 theo 34 tỉnh thành và 16 nhóm ngành",
              icon: DollarSign,
              badge: "Dữ liệu 2026",
              action: () => setActiveSection("salary-benchmark"),
              color: "text-indigo-600 bg-indigo-50 border-indigo-200",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={card.action}
                className="p-5 rounded-xl bg-card border border-border hover:border-sky-300 cursor-pointer transition-all duration-200 shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-slate-50">
                      {card.badge}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {card.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-sky-600 font-semibold mt-4 pt-2 border-t border-border/50">
                  <span>Mở công cụ</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Analysis Batches & Open Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Batches */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">
              Các Đợt Đối Chiếu Tuyển Dụng Gần Đây
            </h3>
            <button
              onClick={() => setActiveSection("history")}
              className="text-xs text-sky-600 hover:underline font-semibold cursor-pointer"
            >
              Xem toàn bộ lịch sử &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {historyBatches.map((batch) => (
              <div
                key={batch.id}
                onClick={() => setActiveSection("match-workflow")}
                className="p-4 rounded-xl bg-card border border-border hover:border-sky-300 cursor-pointer transition-all duration-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                      {batch.batchName}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vị trí: <span className="text-slate-900 font-medium">{batch.jobTitle}</span> • Ngày: {batch.createdAt}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-100">
                        {batch.totalCVs} CV đã phân tích
                      </span>
                      <span>•</span>
                      <span className="text-sky-700 font-semibold">
                        {batch.qualifiedCount} hồ sơ đạt chuẩn (≥ 75%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Điểm Top 1</span>
                    <span className="text-sm font-bold text-sky-700">
                      {batch.topScore}% ({batch.topCandidateName})
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Active JDs Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">
              Vị Trí Đang Tuyển Dụng
            </h3>
            <button
              onClick={() => setActiveSection("jobs")}
              className="text-xs text-sky-600 hover:underline font-semibold cursor-pointer"
            >
              Quản lý JD &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {jobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                onClick={() => setActiveSection("jobs")}
                className="p-3.5 rounded-xl bg-card border border-border hover:border-sky-300 cursor-pointer transition-all duration-200 shadow-xs"
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                    {job.title}
                  </h4>
                  <Badge variant="outline" className="text-[9px] bg-slate-50">
                    {job.level}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {job.department} • {job.location}
                </p>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-border text-[11px]">
                  <span className="font-semibold text-sky-700">{job.salaryRange}</span>
                  <span className="text-muted-foreground font-medium">
                    {job.hiredCount}/{job.openings} chỉ tiêu
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
