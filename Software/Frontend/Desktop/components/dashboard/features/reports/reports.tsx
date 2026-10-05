"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSalesOps } from "@/lib/sales-ops-context";
import { type HistoryBatch, type Candidate } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  FileText,
  Download,
  Calendar,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Search,
  Plus,
  ArrowRight,
  Filter,
  Users,
  Award,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReportModal } from "@/components/dashboard/modals/report-modal";
import { toast } from "sonner";

export function ReportsSection() {
  const {
    historyBatches,
    candidates,
    exportBatchReportCsv,
    setActiveSection,
    setWorkflowStep,
    setWorkflowJD,
  } = useSalesOps();

  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [searchCand, setSearchCand] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setChartsLoaded(true), 250);
    return () => clearTimeout(timer);
  }, []);

  const selectedBatch = useMemo(() => {
    if (selectedBatchId === "all") return null;
    return historyBatches.find((b) => b.id === selectedBatchId) || null;
  }, [selectedBatchId, historyBatches]);

  // Candidates belonging to the selected batch or all
  const filteredCandidates = useMemo(() => {
    let list = candidates;

    // If a specific batch is chosen, filter by job target or batch name
    if (selectedBatch) {
      const jobLower = selectedBatch.jobTitle.toLowerCase();
      list = candidates.filter((c) => {
        const cJob = c.jobTarget.toLowerCase();
        return (
          jobLower.includes(cJob) ||
          cJob.includes(jobLower) ||
          jobLower.split("&").some((part) => cJob.includes(part.trim())) ||
          c.recruiter === selectedBatch.recruiter
        );
      });
      // If list is empty (e.g. mock subset), fallback to all candidates to always show rich data
      if (list.length === 0) list = candidates;
    }

    if (searchCand.trim()) {
      const q = searchCand.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q)) ||
          c.jobTarget.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "qualified") {
        list = list.filter((c) => c.matchScore >= 75);
      } else if (statusFilter === "review") {
        list = list.filter((c) => c.matchScore >= 60 && c.matchScore < 75);
      } else if (statusFilter === "low") {
        list = list.filter((c) => c.matchScore < 60);
      }
    }

    return list;
  }, [candidates, selectedBatch, searchCand, statusFilter]);

  // Total metrics across batches
  const totalCVsAllBatches = useMemo(
    () => historyBatches.reduce((acc, b) => acc + b.totalCVs, 0),
    [historyBatches]
  );
  const totalQualifiedAllBatches = useMemo(
    () => historyBatches.reduce((acc, b) => acc + b.qualifiedCount, 0),
    [historyBatches]
  );
  const avgScoreAllBatches = useMemo(
    () =>
      historyBatches.length > 0
        ? Math.round(
            historyBatches.reduce((acc, b) => acc + b.avgScore, 0) / historyBatches.length
          )
        : 0,
    [historyBatches]
  );

  // Score distribution for chart
  const scoreDistribution = useMemo(() => {
    const pool = filteredCandidates;
    const g90 = pool.filter((c) => c.matchScore >= 90).length;
    const g80 = pool.filter((c) => c.matchScore >= 80 && c.matchScore < 90).length;
    const g70 = pool.filter((c) => c.matchScore >= 70 && c.matchScore < 80).length;
    const gUnder70 = pool.filter((c) => c.matchScore < 70).length;

    return [
      { range: "Xuất sắc (90-100%)", count: g90, color: "#0284c7" },
      { range: "Đạt chuẩn (80-89%)", count: g80, color: "#0ea5e9" },
      { range: "Cần xem xét (70-79%)", count: g70, color: "#38bdf8" },
      { range: "Chưa phù hợp (< 70%)", count: gUnder70, color: "#94a3b8" },
    ];
  }, [filteredCandidates]);

  // Rubric averages for radar
  const rubricRadarData = useMemo(() => {
    if (filteredCandidates.length === 0) return [];
    const avgSkills = Math.round(
      filteredCandidates.reduce((acc, c) => acc + (c.criteriaScores?.skills || 80), 0) /
        filteredCandidates.length
    );
    const avgExp = Math.round(
      filteredCandidates.reduce((acc, c) => acc + (c.criteriaScores?.experience || 78), 0) /
        filteredCandidates.length
    );
    const avgEdu = Math.round(
      filteredCandidates.reduce((acc, c) => acc + (c.criteriaScores?.education || 82), 0) /
        filteredCandidates.length
    );
    const avgSoft = Math.round(
      filteredCandidates.reduce((acc, c) => acc + (c.criteriaScores?.softSkills || 85), 0) /
        filteredCandidates.length
    );

    return [
      { subject: "Kỹ năng chuyên môn", score: avgSkills, fullMark: 100 },
      { subject: "Kinh nghiệm thực chiến", score: avgExp, fullMark: 100 },
      { subject: "Học vấn & Bằng cấp", score: avgEdu, fullMark: 100 },
      { subject: "Kỹ năng mềm & Văn hóa", score: avgSoft, fullMark: 100 },
      { subject: "Mức độ phù hợp JD", score: Math.round((avgSkills + avgExp) / 2), fullMark: 100 },
      { subject: "Thành tích định lượng", score: Math.round((avgSkills + avgSoft) / 2), fullMark: 100 },
    ];
  }, [filteredCandidates]);

  // Export current session to CSV
  const handleExportCurrentSession = () => {
    if (selectedBatch) {
      exportBatchReportCsv(selectedBatch.id);
    } else {
      // Export all sessions
      let csvRows = [
        "ID,Họ Tên Ứng Viên,Email,Số Điện Thoại,Vị Trí Tuyển Dụng,Điểm Match AI,Kinh Nghiệm (Năm),Lương Mong Muốn,Trạng Thái,Giai Đoạn,Điểm Kỹ Năng,Điểm Kinh Nghiệm,Điểm Học Vấn,Điểm Kỹ Năng Mềm,Tóm Tắt Đánh Giá AI",
      ];
      candidates.forEach((c) => {
        csvRows.push(
          `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.jobTarget}",${c.matchScore}%,${c.experienceYears},${c.expectedSalary},"${c.status}","${c.stage}",${c.criteriaScores?.skills || 80},${c.criteriaScores?.experience || 75},${c.criteriaScores?.education || 80},${c.criteriaScores?.softSkills || 85},"${(c.aiSummary || "").replace(/"/g, '""')}"`
        );
      });

      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bao_cao_tong_hop_tat_ca_phien_loc_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất toàn bộ dữ liệu các phiên lọc ra tệp CSV thành công!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>Báo Cáo & Xuất Dữ Liệu Theo Từng Phiên Lọc Hồ Sơ</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dữ liệu đối chiếu AI thời gian thực, bảng điểm Rubric 6 tiêu chuẩn và tải file CSV
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReportModalOpen(true)}
            className="text-xs font-semibold h-9 bg-slate-50 border-slate-200 hover:bg-sky-50 hover:text-sky-700"
          >
            <Filter className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
            Tùy Biến Cột Xuất
          </Button>

          <Button
            size="sm"
            onClick={handleExportCurrentSession}
            className="bg-sky-600 hover:bg-sky-700 text-white shadow-xs text-xs font-bold h-9"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {selectedBatch ? "Xuất CSV Phiên Này" : "Xuất Toàn Bộ Các Phiên (CSV)"}
          </Button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Tổng Số Phiên Lọc</p>
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {historyBatches.length}{" "}
            <span className="text-xs font-normal text-muted-foreground">đợt tuyển</span>
          </p>
          <p className="text-[11px] text-sky-700 mt-1 font-medium">Lưu trữ đầy đủ dữ liệu chấm</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Tổng CV Đã Xử Lý</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalCVsAllBatches}{" "}
            <span className="text-xs font-normal text-muted-foreground">hồ sơ</span>
          </p>
          <p className="text-[11px] text-blue-700 mt-1 font-medium">100% qua bóc tách AI Gemini</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Hồ Sơ Đạt Chuẩn (≥ 75%)</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {totalQualifiedAllBatches}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({Math.round((totalQualifiedAllBatches / (totalCVsAllBatches || 1)) * 100)}%)
            </span>
          </p>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Đủ điều kiện vào vòng phỏng vấn</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Điểm Match AI Trung Bình</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-2">
            {avgScoreAllBatches}%
          </p>
          <p className="text-[11px] text-indigo-600 mt-1 font-medium">Theo khung 6 tiêu chí chuẩn</p>
        </div>
      </div>

      {/* Interactive Session Switcher Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Chọn Phiên Lọc Hồ Sơ Để Xem Dữ Liệu & Xuất File:
          </h3>
          <span className="text-xs text-muted-foreground">
            Đang hiển thị:{" "}
            <strong className="text-sky-700">
              {selectedBatch ? selectedBatch.batchName : "Tất cả các phiên lọc (Tổng hợp)"}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Option All */}
          <div
            onClick={() => setSelectedBatchId("all")}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-all text-left",
              selectedBatchId === "all"
                ? "border-sky-500 bg-sky-50/70 shadow-xs ring-1 ring-sky-400"
                : "border-border bg-card hover:border-sky-300"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Tất Cả Phiên Lọc</span>
              <Badge className="bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0">
                {historyBatches.length} Đợt
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
              Tổng hợp toàn diện mọi chiến dịch
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
              <span>{totalCVsAllBatches} CV</span>
              <span className="font-bold text-sky-700">ĐTB: {avgScoreAllBatches}%</span>
            </div>
          </div>

          {/* Individual Batches */}
          {historyBatches.map((batch) => {
            const isSel = selectedBatchId === batch.id;
            return (
              <div
                key={batch.id}
                onClick={() => setSelectedBatchId(batch.id)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all text-left",
                  isSel
                    ? "border-sky-500 bg-sky-50/70 shadow-xs ring-1 ring-sky-400"
                    : "border-border bg-card hover:border-sky-300"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {batch.batchName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                  {batch.jobTitle}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-sky-600" />
                    {batch.createdAt}
                  </span>
                  <span className="font-bold text-sky-700">ĐTB: {batch.avgScore}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics of the Selected Session */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Distribution Bar Chart */}
        <Card className="lg:col-span-2 border-border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Phân Bổ Phổ Điểm Match AI Trong Phiên Lọc
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {selectedBatch
                    ? `Dữ liệu phân tích từ đợt tuyển "${selectedBatch.batchName}"`
                    : "Tổng hợp từ toàn bộ các ứng viên trong hệ thống"}
                </CardDescription>
              </div>
              <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-xs font-semibold">
                {filteredCandidates.length} Hồ Sơ
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {chartsLoaded ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                      formatter={(val: any) => [`${val} ứng viên`, "Số lượng"]}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#0284c7" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Đang tải biểu đồ phân tích...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 6-Rubric Radar Average */}
        <Card className="lg:col-span-1 border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Đánh Giá 6 Trọng Số Rubric
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Điểm năng lực trung bình của phiên
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {chartsLoaded ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={rubricRadarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#475569" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: "#94a3b8" }} />
                    <Radar name="Điểm Đạt" dataKey="score" stroke="#0284c7" fill="#38bdf8" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Đang vẽ biểu đồ Radar...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Candidate Records Table in this Screening Session */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-border/70 py-4 px-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>
                  Bảng Dữ Liệu Chi Tiết Ứng Viên:{" "}
                  <span className="text-sky-700">
                    {selectedBatch ? selectedBatch.batchName : "Tất Cả Các Phiên"}
                  </span>
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Hiển thị {filteredCandidates.length} ứng viên kèm điểm rubric chi tiết và tóm tắt AI
              </CardDescription>
            </div>

            {/* Table Filters */}
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Lọc tên, kỹ năng..."
                  value={searchCand}
                  onChange={(e) => setSearchCand(e.target.value)}
                  className="pl-8 bg-white border-border text-xs h-8"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-border text-xs rounded-md px-2 py-1 h-8 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">Tất cả mức điểm</option>
                <option value="qualified">Đạt chuẩn (≥ 75%)</option>
                <option value="review">Cần xem xét (60-74%)</option>
                <option value="low">Dưới 60%</option>
              </select>

              <Button
                size="sm"
                onClick={handleExportCurrentSession}
                className="h-8 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shrink-0"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Xuất CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/70 border-b border-border text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ứng Viên</th>
                  <th className="py-3 px-4">Vị Trí Ứng Tuyển</th>
                  <th className="py-3 px-4 text-center">Điểm Match AI</th>
                  <th className="py-3 px-4 text-center">Kỹ Năng</th>
                  <th className="py-3 px-4 text-center">Kinh Nghiệm</th>
                  <th className="py-3 px-4 text-center">Học Vấn</th>
                  <th className="py-3 px-4 text-center">Kỹ Năng Mềm</th>
                  <th className="py-3 px-4">Kỳ Vọng Lương</th>
                  <th className="py-3 px-4">Đánh Giá AI</th>
                  <th className="py-3 px-4 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-white">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-muted-foreground text-xs">
                      Không tìm thấy ứng viên nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((cand) => {
                    const isHigh = cand.matchScore >= 85;
                    const isMed = cand.matchScore >= 75 && cand.matchScore < 85;

                    return (
                      <tr key={cand.id} className="hover:bg-sky-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{cand.name}</p>
                          <p className="text-[11px] text-muted-foreground">{cand.email}</p>
                          <p className="text-[10px] text-slate-500">{cand.phone}</p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-800">{cand.jobTarget}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {cand.experienceYears} năm KN • {cand.location}
                          </p>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={cn(
                                "font-extrabold text-sm px-2 py-0.5 rounded-full border",
                                isHigh
                                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                  : isMed
                                  ? "text-sky-700 bg-sky-50 border-sky-200"
                                  : "text-amber-700 bg-amber-50 border-amber-200"
                              )}
                            >
                              {cand.matchScore}%
                            </span>
                            <span className="text-[9px] text-muted-foreground mt-0.5">
                              {isHigh ? "Xuất sắc" : isMed ? "Đạt chuẩn" : "Xem xét"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center font-semibold text-slate-700">
                          {cand.criteriaScores?.skills || 85}/100
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-700">
                          {cand.criteriaScores?.experience || 80}/100
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-700">
                          {cand.criteriaScores?.education || 85}/100
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-700">
                          {cand.criteriaScores?.softSkills || 90}/100
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                          {cand.expectedSalary.toLocaleString()} ₫
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-[11px] text-slate-600 line-clamp-2" title={cand.aiSummary}>
                            {cand.aiSummary || "Hồ sơ đáp ứng tốt các yêu cầu chính của vị trí."}
                          </p>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Badge
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5",
                              cand.stage === "offer"
                                ? "bg-emerald-100 text-emerald-800"
                                : cand.stage === "interview"
                                ? "bg-sky-100 text-sky-800"
                                : cand.stage === "qualified"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                            )}
                          >
                            {cand.stage === "offer"
                              ? "Offer"
                              : cand.stage === "interview"
                              ? "Phỏng vấn"
                              : cand.stage === "qualified"
                              ? "Đạt chuẩn"
                              : "Sơ loại"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Generation Modal */}
      <ReportModal open={reportModalOpen} onOpenChange={setReportModalOpen} />
    </div>
  );
}
