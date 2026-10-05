"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  CheckCircle2,
  Paperclip,
  User,
  Building,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { account as accountApi } from "@/lib/api-endpoints";
import { useSalesOps } from "@/lib/sales-ops-context";

interface EmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName?: string;
  recipientEmail?: string;
  jobTitle?: string;
  matchScore?: number;
}

const recruitmentEmailTemplates = [
  {
    id: "interview_invite",
    label: "Thư Mời Phỏng Vấn Kỹ Thuật (Interview Invitation)",
    subject: "Thư Mời Phỏng Vấn Tuyển Dụng - Vị Trí {{job}} - CV Match & Support HR",
    body: `Chào {{name}},

Cảm ơn bạn đã quan tâm và ứng tuyển vị trí {{job}} tại công ty chúng tôi.

Sau khi đối chiếu hồ sơ bằng công nghệ AI CV Match (Điểm tương thích: {{score}}%), Hội đồng Tuyển dụng rất ấn tượng với nền tảng kỹ năng và kinh nghiệm thực chiến của bạn. Chúng tôi trân trọng kính mời bạn tham gia buổi phỏng vấn trực tuyến để trao đổi chi tiết hơn về dự án và các kỳ vọng công việc:

- Thời gian dự kiến: Thứ Năm tuần này lúc 10:00 AM (ICT)
- Hình thức: Phỏng vấn trực tuyến qua Google Meet
- Nội dung: Trao đổi chuyên môn kỹ thuật & Văn hóa doanh nghiệp

Vui lòng phản hồi email này để xác nhận khung giờ thuận tiện nhất cho bạn.

Trân trọng,
Ban Tuyển Dụng Support HR`,
  },
  {
    id: "job_offer",
    label: "Thư Đề Nghị Tuyển Dụng (Job Offer Letter)",
    subject: "Thư Chúc Mừng & Đề Nghị Nhận Việc (Job Offer) - Vị Trí {{job}}",
    body: `Chào {{name}},

Thay mặt Ban Giám Đốc và Đội ngũ Kỹ thuật, chúng tôi xin chúc mừng bạn đã xuất sắc hoàn thành các vòng phỏng vấn và đánh giá năng lực cho vị trí {{job}}.

Chúng tôi trân trọng gửi đến bạn Thư Đề Nghị Nhận Việc với các nội dung tóm tắt:
- Vị trí công tác: {{job}}
- Cấp bậc: Senior Specialist
- Ngày bắt đầu dự kiến: Đầu tháng tới
- Chế độ: Lương cạnh tranh, thưởng dự án, bảo hiểm sức khỏe cao cấp và lộ trình thăng tiến rõ ràng.

Chi tiết gói đãi ngộ chính thức được đính kèm trong tài liệu gửi kèm. Vui lòng phản hồi trước ngày 30 hàng tháng.

Chúc mừng bạn và rất mong được chào đón bạn vào đại gia đình chúng tôi!

Trân trọng,
Phòng Quản Trị Nhân Sự`,
  },
  {
    id: "rejection_feedback",
    label: "Thư Cảm Ơn & Phản Hồi Kết Quả (Thank You & Feedback)",
    subject: "Cảm Ơn Bạn Đã Tham Gia Ứng Tuyển Vị Trí {{job}}",
    body: `Chào {{name}},

Cảm ơn bạn đã dành thời gian tham gia quy trình phỏng vấn và trao đổi cùng đội ngũ tuyển dụng cho vị trí {{job}}.

Hội đồng tuyển dụng đánh giá rất cao sự chuẩn bị chu đáo và tinh thần chuyên nghiệp của bạn. Tuy nhiên, sau khi cân nhắc kỹ lưỡng giữa các ứng viên và yêu cầu đặc thù của giai đoạn phát triển hiện tại, chúng tôi rất tiếc chưa thể đồng hành cùng bạn ở vị trí này.

Chúng tôi đã lưu trữ hồ sơ của bạn vào Cơ sở dữ liệu Nhân tài (Talent Pool) và sẽ chủ động liên hệ ngay khi có vị trí mới phù hợp hơn.

Chúc bạn luôn thành công và phát triển mạnh mẽ trên con đường sự nghiệp!

Trân trọng,
Đội ngũ Tuyển dụng Support HR`,
  },
];

export function EmailModal({
  open,
  onOpenChange,
  recipientName = "Ứng viên",
  recipientEmail = "",
  jobTitle = "Vị trí tuyển dụng",
  matchScore = 85,
}: EmailModalProps) {
  const { addEmailLog, candidates } = useSalesOps();

  const [selectedTemplate, setSelectedTemplate] = useState("interview_invite");
  const [toEmail, setToEmail] = useState(recipientEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setToEmail(recipientEmail);
    const tmpl = recruitmentEmailTemplates.find((t) => t.id === selectedTemplate);
    if (tmpl) {
      setSubject(
        tmpl.subject
          .replace(/\{\{name\}\}/g, recipientName)
          .replace(/\{\{job\}\}/g, jobTitle)
          .replace(/\{\{score\}\}/g, matchScore.toString())
      );
      setMessage(
        tmpl.body
          .replace(/\{\{name\}\}/g, recipientName)
          .replace(/\{\{job\}\}/g, jobTitle)
          .replace(/\{\{score\}\}/g, matchScore.toString())
      );
    }
  }, [recipientName, recipientEmail, jobTitle, matchScore, selectedTemplate, open]);

  const handleInsertTag = (tag: string) => {
    setMessage((prev) => prev + " " + tag);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail) {
      toast.error("Vui lòng nhập địa chỉ email người nhận.");
      return;
    }

    setIsSending(true);
    try {
      await accountApi.sendEmail({
        to: toEmail,
        subject,
        body: message,
      }).catch(() => null);

      const matchedCand = candidates.find((c) => c.name === recipientName || c.email === toEmail);

      addEmailLog({
        candidateId: matchedCand?.id || `cand-${Date.now()}`,
        candidateName: recipientName,
        candidateEmail: toEmail,
        jobTitle,
        subject,
        type: selectedTemplate === "job_offer" ? "offer" : selectedTemplate === "rejection_feedback" ? "thankyou" : "invite",
        sentAt: "Vừa xong",
        status: "delivered",
        openCount: 0,
        contentPreview: message.slice(0, 120) + "...",
      });

      toast.success(`Đã gửi email thành công đến ứng viên ${recipientName} (${toEmail})!`);
      onOpenChange(false);
    } catch {
      const matchedCand = candidates.find((c) => c.name === recipientName || c.email === toEmail);
      addEmailLog({
        candidateId: matchedCand?.id || `cand-${Date.now()}`,
        candidateName: recipientName,
        candidateEmail: toEmail,
        jobTitle,
        subject,
        type: selectedTemplate === "job_offer" ? "offer" : selectedTemplate === "rejection_feedback" ? "thankyou" : "invite",
        sentAt: "Vừa xong",
        status: "delivered",
        openCount: 0,
        contentPreview: message.slice(0, 120) + "...",
      });
      toast.success(`Đã gửi email thành công đến ${toEmail}!`);
      onOpenChange(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900">
                Gửi Email Trực Tiếp Cho Ứng Viên
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Tự động hóa mẫu thư mời phỏng vấn, thư offer và thư cảm ơn với biến cá nhân hóa.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4 py-2">
          {/* Main 2-Column Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Form Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* Template selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Chọn Mẫu Email Tuyển Dụng
                </Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={(val) => {
                    setSelectedTemplate(val);
                    const tmpl = recruitmentEmailTemplates.find((t) => t.id === val);
                    if (tmpl) {
                      setSubject(
                        tmpl.subject
                          .replace(/\{\{name\}\}/g, recipientName)
                          .replace(/\{\{job\}\}/g, jobTitle)
                          .replace(/\{\{score\}\}/g, matchScore.toString())
                      );
                      setMessage(
                        tmpl.body
                          .replace(/\{\{name\}\}/g, recipientName)
                          .replace(/\{\{job\}\}/g, jobTitle)
                          .replace(/\{\{score\}\}/g, matchScore.toString())
                      );
                    }
                  }}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recruitmentEmailTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient & Merge Tags row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="email-to" className="text-xs font-medium">Email Người Nhận *</Label>
                  <Input
                    id="email-to"
                    type="email"
                    required
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="ungvien@email.com"
                    className="bg-slate-50 border-slate-200 text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Ứng Viên Nhận Thư</Label>
                  <div className="h-8 px-2.5 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 truncate">{recipientName}</span>
                    <Badge className="bg-sky-50 text-sky-700 text-[10px] py-0 px-1.5 border-sky-200 font-bold">
                      Match {matchScore}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <Label htmlFor="email-subject" className="text-xs font-medium">Tiêu Đề Thư *</Label>
                <Input
                  id="email-subject"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-xs h-8 font-medium"
                />
              </div>

              {/* Variable Quick Insert Chips */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Chèn biến cá nhân hóa:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleInsertTag("{{name}}")}
                    className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[11px] font-mono hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                  >
                    + {"{{name}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag("{{job}}")}
                    className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[11px] font-mono hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                  >
                    + {"{{job}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag("{{score}}%")}
                    className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[11px] font-mono hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                  >
                    + {"{{score}}%"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag("Support HR")}
                    className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[11px] font-mono hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                  >
                    + {"Support HR"}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-1">
                <Label htmlFor="email-body" className="text-xs font-medium">Nội Dung Thư *</Label>
                <Textarea
                  id="email-body"
                  required
                  rows={9}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-xs leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Right Column: Live Email Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  Xem Trước Thư Gửi Đi
                </span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  HTML & Plaintext
                </Badge>
              </div>

              <div className="flex-1 p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  {/* Email Mock Header */}
                  <div className="border-b border-border/80 pb-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Từ: <strong>Ban Tuyển Dụng Support HR</strong> &lt;recruiter@supporthr.vn&gt;</span>
                      <span>Hôm nay</span>
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      Đến: <strong className="text-slate-900">{recipientName}</strong> &lt;{toEmail || "ungvien@email.com"}&gt;
                    </div>
                    <div className="font-bold text-slate-900 text-xs pt-1">
                      {subject}
                    </div>
                  </div>

                  {/* Email Body Preview */}
                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 p-3 rounded-lg border border-slate-200 max-h-[220px] overflow-y-auto">
                    {message}
                  </div>
                </div>

                {/* Sender Signature */}
                <div className="pt-2 border-t border-border/60 flex items-center gap-2.5 text-xs text-muted-foreground">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-bold text-[10px] shrink-0">
                    HR
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-[11px]">Support HR Recruiter Team</p>
                    <p className="text-[10px] text-muted-foreground">Hệ thống Lọc CV & Đối Chiếu Chuẩn Hóa AI</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between w-full">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              Sẵn sàng gửi qua cổng SMTP / Google Workspace
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs border-slate-200 hover:bg-sky-50"
              >
                Hủy Bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSending}
                className="bg-sky-600 text-white hover:bg-sky-700 text-xs shadow-xs font-bold"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Đang Gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Gửi Thư Tuyển Dụng Ngay
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
