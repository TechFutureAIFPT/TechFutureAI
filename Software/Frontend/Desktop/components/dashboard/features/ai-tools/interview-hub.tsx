"use client";

import React, { useState } from "react";
import { useSalesOps } from "@/lib/sales-ops-context";
import { type InterviewItem, type EmailLogItem } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Mail,
  Clock,
  Video,
  MapPin,
  Users,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Send,
  FileText,
  Copy,
  Trash2,
  Edit3,
  Calendar as CalendarIcon,
  Check,
  Building2,
  TrendingUp,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

export function InterviewHubSection() {
  const {
    interviews,
    addInterview,
    updateInterview,
    deleteInterview,
    emailLogs,
    addEmailLog,
    emailTemplates,
    candidates,
    jobs,
    setActiveSection,
  } = useSalesOps();

  // Tab State: "interviews" | "emails" | "templates"
  const [activeTab, setActiveTab] = useState<"interviews" | "emails" | "templates">("interviews");

  // Filter States for Interviews
  const [interviewSearch, setInterviewSearch] = useState("");
  const [interviewStatusFilter, setInterviewStatusFilter] = useState<string>("all");

  // Modal States
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<InterviewItem | null>(null);
  const [feedbackScore, setFeedbackScore] = useState(90);
  const [feedbackNotes, setFeedbackNotes] = useState("");

  // Email Log Preview Modal State
  const [previewEmailLog, setPreviewEmailLog] = useState<EmailLogItem | null>(null);

  // Quick Composer State
  const [composeCandidateId, setComposeCandidateId] = useState<string>(candidates[0]?.id || "");
  const [composeTemplateId, setComposeTemplateId] = useState<string>(emailTemplates[0]?.id || "");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  // Schedule Modal Form State
  const [newCandidateId, setNewCandidateId] = useState<string>(candidates[0]?.id || "");
  const [newRound, setNewRound] = useState<InterviewItem["round"]>("technical");
  const [newDate, setNewDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [newTime, setNewTime] = useState("10:00");
  const [newDuration, setNewDuration] = useState("45");
  const [newFormat, setNewFormat] = useState<InterviewItem["format"]>("gmeet");
  const [newMeetingUrl, setNewMeetingUrl] = useState("https://meet.google.com/rec-interview-room");
  const [newInterviewers, setNewInterviewers] = useState("Tech Lead, HR Specialist");
  const [newNotes, setNewNotes] = useState(
    "Đánh giá năng lực chuyên môn thực chiến, giải quyết tình huống kỹ thuật và độ tương thích văn hóa."
  );

  // Sync quick composer body when candidate or template changes
  const applyTemplateToComposer = (candId: string, tmplId: string) => {
    const cand = candidates.find((c) => c.id === candId) || candidates[0];
    const tmpl = emailTemplates.find((t) => t.id === tmplId) || emailTemplates[0];
    if (!cand || !tmpl) return;

    let sub = tmpl.subject
      .replace(/{{name}}/g, cand.name)
      .replace(/{{job}}/g, cand.jobTarget)
      .replace(/{{score}}/g, String(cand.matchScore));

    let body = tmpl.body
      .replace(/{{name}}/g, cand.name)
      .replace(/{{job}}/g, cand.jobTarget)
      .replace(/{{score}}/g, String(cand.matchScore))
      .replace(/{{time}}/g, "10:00")
      .replace(/{{date}}/g, "26/08/2026")
      .replace(/{{link}}/g, "https://meet.google.com/rec-interview-room")
      .replace(/{{interviewers}}/g, "Ban Giám Đốc Kỹ Thuật")
      .replace(/{{salary}}/g, "30,000,000 VNĐ / tháng")
      .replace(/{{start_date}}/g, "01/09/2026")
      .replace(/{{location}}/g, "TP. Hồ Chí Minh");

    setComposeSubject(sub);
    setComposeBody(body);
  };

  // Initialize composer on first render if empty
  React.useEffect(() => {
    if (!composeSubject && candidates[0] && emailTemplates[0]) {
      applyTemplateToComposer(candidates[0].id, emailTemplates[0].id);
    }
  }, [candidates, emailTemplates]);

  // Handle Quick Email Send
  const handleSendQuickEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const cand = candidates.find((c) => c.id === composeCandidateId);
    if (!cand) {
      toast.error("Vui lòng chọn ứng viên nhận thư!");
      return;
    }
    if (!composeSubject.trim() || !composeBody.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung email!");
      return;
    }

    const tmpl = emailTemplates.find((t) => t.id === composeTemplateId);

    addEmailLog({
      candidateId: cand.id,
      candidateName: cand.name,
      candidateEmail: cand.email,
      jobTitle: cand.jobTarget,
      subject: composeSubject,
      type: tmpl?.type || "invite",
      sentAt: "Vừa xong",
      status: "delivered",
      openCount: 0,
      contentPreview: composeBody.slice(0, 120) + "...",
    });

    toast.success(`Đã gửi email tới ${cand.name} (${cand.email}) thành công!`);
  };

  // Handle Create New Interview
  const handleCreateInterview = (e: React.FormEvent) => {
    e.preventDefault();
    const cand = candidates.find((c) => c.id === newCandidateId);
    if (!cand) {
      toast.error("Vui lòng chọn ứng viên!");
      return;
    }

    const roundName =
      newRound === "screening"
        ? "Vòng 1: Sơ Vấn Nhân Sự (HR Screening)"
        : newRound === "technical"
        ? "Vòng 2: Đánh Giá Kỹ Thuật (Technical Round)"
        : newRound === "final"
        ? "Vòng 3: Phỏng Vấn Giám Đốc (Executive / Culture Fit)"
        : "Vòng Đánh Giá Văn Hóa (Culture Round)";

    const interviewersList = newInterviewers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    addInterview({
      candidateId: cand.id,
      candidateName: cand.name,
      candidateEmail: cand.email,
      candidatePhone: cand.phone,
      candidateAvatar: cand.name
        .split(" ")
        .map((w) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase(),
      jobTitle: cand.jobTarget,
      round: newRound,
      roundName,
      date: newDate,
      time: newTime,
      durationMinutes: parseInt(newDuration, 10) || 45,
      format: newFormat,
      meetingUrlOrRoom:
        newFormat === "onsite"
          ? "Phòng Họp Ban Giám Đốc - Tầng 12"
          : newMeetingUrl || "https://meet.google.com/interview-room",
      interviewers: interviewersList.length > 0 ? interviewersList : ["Chuyên viên Tuyển dụng"],
      status: "scheduled",
      notes: newNotes,
      score: cand.matchScore,
    });

    setIsScheduleModalOpen(false);
  };

  // Handle Save Feedback
  const handleSaveFeedback = () => {
    if (!selectedInterviewForFeedback) return;
    updateInterview(selectedInterviewForFeedback.id, {
      score: feedbackScore,
      feedback: feedbackNotes,
      status: "completed",
    });
    setIsFeedbackModalOpen(false);
    setSelectedInterviewForFeedback(null);
    toast.success("Đã lưu kết quả đánh giá và chuyển trạng thái buổi phỏng vấn sang 'Đã Hoàn Thành'!");
  };

  // Filtered Interviews
  const filteredInterviews = interviews.filter((item) => {
    const matchQuery =
      item.candidateName.toLowerCase().includes(interviewSearch.toLowerCase()) ||
      item.jobTitle.toLowerCase().includes(interviewSearch.toLowerCase()) ||
      item.roundName.toLowerCase().includes(interviewSearch.toLowerCase());

    if (!matchQuery) return false;

    if (interviewStatusFilter === "scheduled") return item.status === "scheduled";
    if (interviewStatusFilter === "completed") return item.status === "completed";
    if (interviewStatusFilter === "today") {
      const todayStr = new Date().toISOString().split("T")[0];
      return item.date === todayStr;
    }
    return true;
  });

  // Calculate Metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingCount = interviews.filter((i) => i.status === "scheduled").length;
  const todayCount = interviews.filter((i) => i.date === todayStr).length;
  const completedCount = interviews.filter((i) => i.status === "completed").length;
  const totalEmailsSent = emailLogs.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. EXECUTIVE KPI SUMMARY STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1 */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Lịch Phỏng Vấn Sắp Tới
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{upcomingCount}</span>
                <span className="text-xs text-sky-600 font-bold">Buổi hẹn</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{completedCount} buổi đã hoàn thành</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Lịch Hẹn Hôm Nay
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-600">{todayCount}</span>
                <span className="text-xs text-blue-600 font-bold">Ứng viên</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">Đã sẵn sàng link họp</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Email Tuyển Dụng Đã Gửi
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{totalEmailsSent}</span>
                <span className="text-xs text-slate-500 font-bold">Thư</span>
              </div>
              <p className="text-[11px] text-sky-600 font-medium">Thư mời & Job Offer</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tỉ Lệ Phản Hồi Ứng Viên
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">84.5%</span>
                <span className="text-xs text-emerald-700 font-bold">Open Rate</span>
              </div>
              <p className="text-[11px] text-muted-foreground">68.2% Xác nhận tham gia</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. NAVIGATION TABS & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
        {/* Switch Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("interviews")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "interviews"
                ? "bg-white text-sky-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Lịch Phỏng Vấn ({interviews.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("emails")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "emails"
                ? "bg-white text-sky-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Hộp Thư & Gửi Email ({emailLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "templates"
                ? "bg-white text-sky-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Mẫu Thư Chuẩn ({emailTemplates.length})</span>
          </button>
        </div>

        {/* Action Button Group */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={() => setIsScheduleModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-9 px-3.5 shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lên Lịch Phỏng Vấn Mới</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveTab("emails");
              window.scrollTo({ top: 300, behavior: "smooth" });
            }}
            className="text-slate-700 font-semibold text-xs h-9 px-3 border-slate-300 hover:bg-sky-50"
          >
            <Send className="w-3.5 h-3.5 text-sky-600 mr-1.5" />
            <span>Soạn Email Nhanh</span>
          </Button>
        </div>
      </div>

      {/* 3. TAB 1: INTERVIEW SCHEDULE & TIMELINE */}
      {activeTab === "interviews" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm ứng viên, chức danh, vòng phỏng vấn..."
                value={interviewSearch}
                onChange={(e) => setInterviewSearch(e.target.value)}
                className="pl-9 h-8.5 text-xs bg-slate-50 border-border"
              />
            </div>

            {/* Quick Status Filters */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {[
                { id: "all", label: "Tất cả" },
                { id: "today", label: "Hôm nay" },
                { id: "scheduled", label: "Sắp diễn ra" },
                { id: "completed", label: "Đã hoàn thành" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setInterviewStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    interviewStatusFilter === f.id
                      ? "bg-sky-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Interview Cards */}
          {filteredInterviews.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
              <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-60" />
              <p className="font-bold text-slate-800 text-sm">Không tìm thấy lịch phỏng vấn phù hợp</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hãy tạo buổi phỏng vấn mới hoặc thay đổi bộ lọc tìm kiếm
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredInterviews.map((item) => {
                const isToday = item.date === todayStr;
                const isCompleted = item.status === "completed";

                return (
                  <Card
                    key={item.id}
                    className={`border transition-all duration-200 hover:shadow-md ${
                      isCompleted
                        ? "bg-slate-50/70 border-slate-200"
                        : isToday
                        ? "bg-sky-50/40 border-sky-300 shadow-xs"
                        : "bg-white border-border"
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Candidate Identity & Role */}
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {item.candidateAvatar || "UV"}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                {item.candidateName}
                              </h4>
                              {item.score && (
                                <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] font-bold">
                                  Match {item.score}%
                                </Badge>
                              )}
                              {isToday && !isCompleted && (
                                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold animate-pulse">
                                  Hôm nay
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {isCompleted ? "Đã Hoàn Thành" : "Đã Lên Lịch"}
                              </Badge>
                            </div>

                            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{item.jobTitle}</span>
                            </p>

                            <p className="text-[11px] font-bold text-sky-700">
                              {item.roundName}
                            </p>
                          </div>
                        </div>

                        {/* Schedule Date Time & Format */}
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <div className="p-2.5 rounded-lg bg-slate-100/90 border border-slate-200/80 space-y-0.5 min-w-[140px]">
                            <span className="text-[10px] font-semibold text-muted-foreground block flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3 text-sky-600" />
                              Thời gian hẹn:
                            </span>
                            <p className="font-extrabold text-slate-900">
                              {item.time} • {item.date}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              Thời lượng: {item.durationMinutes} phút
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-100/90 border border-slate-200/80 space-y-0.5 min-w-[170px]">
                            <span className="text-[10px] font-semibold text-muted-foreground block flex items-center gap-1">
                              {item.format === "onsite" ? (
                                <MapPin className="w-3 h-3 text-amber-600" />
                              ) : (
                                <Video className="w-3 h-3 text-blue-600" />
                              )}
                              Hình thức phỏng vấn:
                            </span>
                            <p className="font-extrabold text-slate-900 truncate max-w-[180px]">
                              {item.format === "onsite"
                                ? "Trực tiếp tại văn phòng"
                                : item.format === "zoom"
                                ? "Zoom Meeting"
                                : "Google Meet"}
                            </p>
                            {item.format !== "onsite" && item.meetingUrlOrRoom && (
                              <a
                                href={item.meetingUrlOrRoom}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-sky-600 hover:underline flex items-center gap-1"
                              >
                                <span>Vào phòng họp</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end lg:self-center">
                          {!isCompleted ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedInterviewForFeedback(item);
                                  setFeedbackScore(item.score || 90);
                                  setFeedbackNotes(item.feedback || "");
                                  setIsFeedbackModalOpen(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                <span>Đánh Giá PV</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  updateInterview(item.id, {
                                    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                                      .toISOString()
                                      .split("T")[0],
                                  });
                                }}
                                className="text-xs font-semibold h-8 px-2.5 border-slate-300 hover:bg-sky-50"
                              >
                                <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                <span>Dời Lịch</span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedInterviewForFeedback(item);
                                setFeedbackScore(item.score || 90);
                                setFeedbackNotes(item.feedback || "");
                                setIsFeedbackModalOpen(true);
                              }}
                              className="text-xs font-semibold h-8 px-3 border-slate-300 hover:bg-sky-50"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1 text-sky-600" />
                              <span>Xem Đánh Giá</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteInterview(item.id)}
                            className="text-xs text-rose-600 hover:bg-rose-50 h-8 px-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Interviewer list & Notes */}
                      <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground font-medium">Hội đồng phỏng vấn:</span>
                          {item.interviewers.map((name, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] font-semibold">
                              {name}
                            </Badge>
                          ))}
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-slate-600 truncate max-w-md italic">
                            💡 "{item.notes}"
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: EMAIL OUTREACH HUB & LOGS */}
      {activeTab === "emails" && (
        <div className="space-y-6">
          {/* Quick Send Composer Card */}
          <Card className="border-sky-200 bg-gradient-to-br from-sky-50/50 via-white to-slate-50 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Soạn & Gửi Email Tuyển Dụng Nhanh
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Tự động điền các biến cá nhân hóa của ứng viên theo mẫu chuẩn
                    </p>
                  </div>
                </div>

                <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] font-bold">
                  ⚡ Realtime Dispatch
                </Badge>
              </div>

              <form onSubmit={handleSendQuickEmail} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Candidate */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">1. Chọn Ứng Viên Nhận Thư</Label>
                    <Select
                      value={composeCandidateId}
                      onValueChange={(val) => {
                        setComposeCandidateId(val);
                        applyTemplateToComposer(val, composeTemplateId);
                      }}
                    >
                      <SelectTrigger className="bg-white border-border text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name} — {c.jobTarget} ({c.matchScore}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Template */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">2. Chọn Mẫu Thư (Template)</Label>
                    <Select
                      value={composeTemplateId}
                      onValueChange={(val) => {
                        setComposeTemplateId(val);
                        applyTemplateToComposer(composeCandidateId, val);
                      }}
                    >
                      <SelectTrigger className="bg-white border-border text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Tiêu Đề Email</Label>
                  <Input
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="bg-white border-border text-xs h-9 font-semibold"
                    placeholder="Nhập tiêu đề email..."
                    required
                  />
                </div>

                {/* Body Textarea */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Nội Dung Thư Tuyển Dụng</Label>
                  <Textarea
                    rows={7}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="bg-white border-border text-xs leading-relaxed font-sans"
                    placeholder="Nhập nội dung thư..."
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground italic">
                    💡 Thư sẽ được gửi qua máy chủ email kết nối với Support HR
                  </span>

                  <Button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs h-9 px-5 shadow-md shadow-sky-500/20"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    <span>Gửi Email Ngay</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Email Logs Table */}
          <Card className="border-border bg-card shadow-2xs rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                Nhật Ký Email Đã Gửi Đi ({emailLogs.length})
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold text-sky-700 bg-sky-50 border-sky-200">
                Tự động đồng bộ
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5">Ứng Viên Nhận Thư</th>
                    <th className="p-3.5">Tiêu Đề Email</th>
                    <th className="p-3.5">Loại Thư</th>
                    <th className="p-3.5">Thời Gian</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {emailLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{log.candidateName}</div>
                        <div className="text-[11px] text-muted-foreground">{log.candidateEmail}</div>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate">{log.subject}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{log.contentPreview}</div>
                      </td>

                      <td className="p-3.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold uppercase ${
                            log.type === "invite"
                              ? "bg-sky-100 text-sky-800"
                              : log.type === "offer"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {log.type === "invite" ? "Thư Mời PV" : log.type === "offer" ? "Job Offer" : "Thư Cảm Ơn"}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-slate-600 whitespace-nowrap">{log.sentAt}</td>

                      <td className="p-3.5">
                        <Badge
                          className={`text-[10px] font-bold ${
                            log.status === "replied"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : log.status === "opened"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {log.status === "replied"
                            ? "🟢 Đã phản hồi"
                            : log.status === "opened"
                            ? `🔵 Đã mở (${log.openCount} lần)`
                            : "⚪ Đã gửi"}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewEmailLog(log)}
                          className="text-[11px] font-semibold h-7 px-2.5 border-slate-300 hover:bg-sky-50"
                        >
                          Xem Chi Tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 5. TAB 3: EMAIL TEMPLATES LIBRARY */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emailTemplates.map((t) => (
            <Card key={t.id} className="border-border bg-card shadow-2xs flex flex-col justify-between rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold bg-sky-50 text-sky-700 border-sky-200"
                  >
                    {t.type === "invite" ? "Mời Phỏng Vấn" : t.type === "offer" ? "Job Offer" : "Thư Cảm Ơn"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">Cập nhật: {t.lastUpdated}</span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900">{t.title}</h4>
                <p className="text-xs text-slate-600">{t.description}</p>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 line-clamp-4 whitespace-pre-line">
                  {t.body}
                </div>
              </CardContent>

              <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(t.body);
                    toast.success("Đã sao chép mẫu thư vào clipboard!");
                  }}
                  className="text-xs text-slate-600 h-8 px-2"
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Sao chép
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setComposeTemplateId(t.id);
                    applyTemplateToComposer(composeCandidateId, t.id);
                    setActiveTab("emails");
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-8 px-3"
                >
                  Dùng Mẫu Này
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 6. MODAL: LÊN LỊCH PHỎNG VẤN MỚI */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
              <CalendarDays className="w-4 h-4 text-sky-600" />
              <span>Lên Lịch Phỏng Vấn Ứng Viên Mới</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập ngày giờ, hình thức họp và hội đồng đánh giá phỏng vấn
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInterview} className="space-y-3.5 py-1">
            {/* Candidate */}
            <div className="space-y-1">
              <Label className="text-xs font-bold">Ứng Viên</Label>
              <Select value={newCandidateId} onValueChange={setNewCandidateId}>
                <SelectTrigger className="text-xs h-8.5 bg-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} — {c.jobTarget} ({c.matchScore}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Round */}
            <div className="space-y-1">
              <Label className="text-xs font-bold">Vòng Phỏng Vấn</Label>
              <Select
                value={newRound}
                onValueChange={(val) => setNewRound(val as InterviewItem["round"])}
              >
                <SelectTrigger className="text-xs h-8.5 bg-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screening" className="text-xs">Vòng 1: Sơ Vấn Nhân Sự (HR Screening)</SelectItem>
                  <SelectItem value="technical" className="text-xs">Vòng 2: Đánh Giá Kỹ Thuật (Technical Round)</SelectItem>
                  <SelectItem value="final" className="text-xs">Vòng 3: Phỏng Vấn Ban Giám Đốc (Executive / Culture Fit)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Ngày Hẹn</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="text-xs h-8.5 bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Giờ Bắt Đầu</Label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="text-xs h-8.5 bg-slate-50"
                  required
                />
              </div>
            </div>

            {/* Duration & Format */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Thời Lượng (Phút)</Label>
                <Select value={newDuration} onValueChange={setNewDuration}>
                  <SelectTrigger className="text-xs h-8.5 bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30" className="text-xs">30 phút</SelectItem>
                    <SelectItem value="45" className="text-xs">45 phút</SelectItem>
                    <SelectItem value="60" className="text-xs">60 phút</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Hình Thức Họp</Label>
                <Select
                  value={newFormat}
                  onValueChange={(val) => setNewFormat(val as InterviewItem["format"])}
                >
                  <SelectTrigger className="text-xs h-8.5 bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmeet" className="text-xs">Google Meet</SelectItem>
                    <SelectItem value="zoom" className="text-xs">Zoom Meeting</SelectItem>
                    <SelectItem value="onsite" className="text-xs">Trực tiếp tại văn phòng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Meeting Link */}
            {newFormat !== "onsite" && (
              <div className="space-y-1">
                <Label className="text-xs font-bold">Link Phòng Họp Trực Tuyến</Label>
                <Input
                  value={newMeetingUrl}
                  onChange={(e) => setNewMeetingUrl(e.target.value)}
                  className="text-xs h-8.5 bg-slate-50"
                  placeholder="https://meet.google.com/..."
                />
              </div>
            )}

            {/* Interviewers */}
            <div className="space-y-1">
              <Label className="text-xs font-bold">Hội Đồng Phỏng Vấn (Cách nhau dấu phẩy)</Label>
              <Input
                value={newInterviewers}
                onChange={(e) => setNewInterviewers(e.target.value)}
                className="text-xs h-8.5 bg-slate-50"
                placeholder="Tech Lead, HR Specialist..."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
              >
                Tạo Lịch Phỏng Vấn
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. MODAL: ĐÁNH GIÁ & GHI CHÚ PHỎNG VẤN */}
      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đánh Giá Kết Quả Phỏng Vấn</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ứng viên: <strong>{selectedInterviewForFeedback?.candidateName}</strong> —{" "}
              {selectedInterviewForFeedback?.roundName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Điểm Đánh Giá Sau Phỏng Vấn</Label>
                <span className="text-sm font-black text-sky-700">{feedbackScore} / 100 Điểm</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={feedbackScore}
                onChange={(e) => setFeedbackScore(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Nhận Xét Của Hội Đồng Tuyển Dụng</Label>
              <Textarea
                rows={4}
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Nhận xét chi tiết về năng lực, phản ứng tình huống và khuyến nghị tuyển dụng..."
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFeedbackModalOpen(false)}
                className="text-xs"
              >
                Đóng
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveFeedback}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Lưu & Hoàn Tất Buổi PV
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 8. MODAL: XEM CHI TIẾT EMAIL ĐÃ GỬI */}
      <Dialog open={Boolean(previewEmailLog)} onOpenChange={(open) => !open && setPreviewEmailLog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold">Chi Tiết Email Đã Gửi</DialogTitle>
            <DialogDescription className="text-xs">
              Người nhận: <strong>{previewEmailLog?.candidateName}</strong> ({previewEmailLog?.candidateEmail})
            </DialogDescription>
          </DialogHeader>

          {previewEmailLog && (
            <div className="space-y-3 py-1 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Tiêu đề:</span>
                <p className="font-bold text-slate-900">{previewEmailLog.subject}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    Gửi lúc: {previewEmailLog.sentAt}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                    {previewEmailLog.status === "replied" ? "Đã phản hồi" : "Đã gửi thành công"}
                  </Badge>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-slate-200 max-h-60 overflow-y-auto whitespace-pre-line text-slate-700 leading-relaxed font-sans">
                {previewEmailLog.contentPreview}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              size="sm"
              onClick={() => setPreviewEmailLog(null)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
