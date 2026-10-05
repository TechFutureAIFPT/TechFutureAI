"use client";

import { useState } from "react";
import { useSalesOps } from "@/lib/sales-ops-context";
import { type Candidate } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Send,
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  FileText,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

export function ContactCandidatesSection() {
  const { candidates } = useSalesOps();

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
    candidates.slice(0, 3).map((c) => c.id)
  );

  const [templateType, setTemplateType] = useState("invite");
  const [subject, setSubject] = useState(
    "Thư Mời Tham Gia Phỏng Vấn Tuyển Dụng - Support HR & CV Match"
  );
  const [emailBody, setEmailBody] = useState(
    `Chào {{name}},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vị trí {{job}} tại công ty chúng tôi.\n\nSau khi đối chiếu hồ sơ và đánh giá sơ bộ (Điểm Match AI: {{score}}%), chúng tôi rất ấn tượng với năng lực của bạn. Bộ phận Tuyển dụng trân trọng kính mời bạn tham gia buổi phỏng vấn trực tuyến để trao đổi chi tiết hơn về dự án và các kỳ vọng công việc.\n\n- Thời gian dự kiến: Thứ Năm tuần này lúc 10:00 AM\n- Hình thức: Google Meet trực tuyến\n\nVui lòng phản hồi email này để xác nhận lịch họp.\n\nTrân trọng,\nĐội ngũ Tuyển Dụng Support HR`
  );

  const [isSending, setIsSending] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidateIds(candidates.map((c) => c.id));
    } else {
      setSelectedCandidateIds([]);
    }
  };

  const handleToggleCandidate = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSendBulkEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCandidateIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 ứng viên để gửi email");
      return;
    }

    setIsSending(true);
    const toastId = toast.loading(`Đang gửi email hàng loạt tới ${selectedCandidateIds.length} ứng viên...`);

    setTimeout(() => {
      setIsSending(false);
      toast.success(
        `Đã gửi thành công ${selectedCandidateIds.length} email tuyển dụng với đầy đủ thông tin cá nhân hóa!`,
        { id: toastId }
      );
    }, 1500);
  };

  const handleTemplateChange = (val: string) => {
    setTemplateType(val);
    if (val === "invite") {
      setSubject("Thư Mời Tham Gia Phỏng Vấn Tuyển Dụng - Support HR");
      setEmailBody(
        `Chào {{name}},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vị trí {{job}}.\n\nHồ sơ của bạn đạt điểm đối chiếu AI xuất sắc ({{score}}%). Chúng tôi trân trọng mời bạn tham gia buổi phỏng vấn kỹ thuật vào tuần này.\n\nTrân trọng,\nBan Tuyển Dụng`
      );
    } else if (val === "offer") {
      setSubject("Thư Đề Nghị Tuyển Dụng (Job Offer) - Vị Trí {{job}}");
      setEmailBody(
        `Chào {{name}},\n\nChúc mừng bạn đã xuất sắc vượt qua các vòng phỏng vấn cho vị trí {{job}}.\n\nChúng tôi trân trọng gửi đến bạn Thư Đề Nghị Nhận Việc chính thức đính kèm tệp chi tiết đãi ngộ.\n\nTrân trọng,\nPhòng Quản Trị Nhân Sự`
      );
    } else if (val === "thankyou") {
      setSubject("Cảm Ơn Bạn Đã Tham Gia Ứng Tuyển Vị Trí {{job}}");
      setEmailBody(
        `Chào {{name}},\n\nCảm ơn bạn đã dành thời gian trao đổi cùng chúng tôi. Dù chưa thể đồng hành ở giai đoạn này, chúng tôi xin phép lưu hồ sơ của bạn vào Talent Pool để liên hệ cho các cơ hội tiếp theo.\n\nTrân trọng,\nĐội ngũ Tuyển Dụng`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Selector Column */}
        <Card className="border-border bg-card shadow-xs flex flex-col h-[560px]">
          <CardHeader className="pb-3 border-b border-border bg-sky-50/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Chọn Ứng Viên Nhận Mail
                </CardTitle>
                <CardDescription className="text-xs">
                  Đã chọn {selectedCandidateIds.length} / {candidates.length} hồ sơ
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <Checkbox
                  checked={
                    selectedCandidateIds.length === candidates.length &&
                    candidates.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-muted-foreground">Tất cả</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-3 overflow-y-auto space-y-2">
            {candidates.map((c, idx) => {
              const isChecked = selectedCandidateIds.includes(c.id);

              return (
                <div
                  key={`${c.id}-${idx}`}
                  onClick={() => handleToggleCandidate(c.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-2 ${
                    isChecked
                      ? "bg-sky-50/80 border-sky-300 text-slate-900 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-sky-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggleCandidate(c.id)}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {c.jobTarget}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {c.email}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 font-bold ${
                      c.matchScore >= 85
                        ? "bg-sky-50 text-sky-700 border-sky-300"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {c.matchScore}%
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Email Composer Column */}
        <Card className="lg:col-span-2 border-border bg-card shadow-xs flex flex-col justify-between">
          <form onSubmit={handleSendBulkEmail} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-900">Mẫu Thư Tuyển Dụng</Label>
                <Select value={templateType} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="bg-slate-50 border-sky-100 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invite">Thư Mời Phỏng Vấn (Interview Invitation)</SelectItem>
                    <SelectItem value="offer">Thư Mời Nhận Việc (Job Offer Letter)</SelectItem>
                    <SelectItem value="thankyou">Thư Cảm Ơn & Phản Hồi (Thank You Letter)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-900">Thẻ Biến Tự Động (Merge Tags)</Label>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-1 rounded bg-sky-50 text-sky-700 font-mono border border-sky-200">
                    {"{{name}}"}
                  </span>
                  <span className="px-2 py-1 rounded bg-sky-50 text-sky-700 font-mono border border-sky-200">
                    {"{{job}}"}
                  </span>
                  <span className="px-2 py-1 rounded bg-sky-50 text-sky-700 font-mono border border-sky-200">
                    {"{{score}}"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-900">Tiêu Đề Email *</Label>
              <Input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-50 border-sky-100 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-900">Nội Dung Thư Điện Tử *</Label>
              <Textarea
                required
                rows={10}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="bg-slate-50 border-sky-100 text-xs leading-relaxed font-mono text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Sẽ gửi tới <span className="font-bold text-slate-900">{selectedCandidateIds.length}</span> địa chỉ email ứng viên
              </span>

              <Button
                type="submit"
                disabled={isSending || selectedCandidateIds.length === 0}
                className="bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold shadow-xs"
              >
                <Send className={`w-3.5 h-3.5 mr-1.5 ${isSending ? "animate-spin" : ""}`} />
                {isSending ? "Đang Gửi Hàng Loạt..." : "Gửi Email Tức Thì"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
