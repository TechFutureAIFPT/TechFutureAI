"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSalesOps } from "@/lib/sales-ops-context";

interface InterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
}

export function InterviewModal({
  open,
  onOpenChange,
  candidateId = "",
  candidateName = "Ứng viên",
  candidateEmail = "",
  jobTitle = "",
}: InterviewModalProps) {
  const { addInterview, candidates } = useSalesOps();

  const [round, setRound] = useState<"screening" | "technical" | "final" | "culture">("technical");
  const [date, setDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("45");
  const [format, setFormat] = useState<"gmeet" | "zoom" | "onsite">("gmeet");
  const [interviewers, setInterviewers] = useState("Tech Lead, HR Specialist");
  const [notes, setNotes] = useState(
    "Đánh giá kinh nghiệm thực chiến, giải quyết tình huống kỹ thuật và độ phù hợp văn hóa đội ngũ."
  );

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const roundName =
      round === "screening"
        ? "Vòng 1: Sơ Vấn Nhân Sự (HR Screening)"
        : round === "technical"
        ? "Vòng 2: Đánh Giá Kỹ Thuật (Technical Round)"
        : "Vòng 3: Phỏng Vấn Ban Giám Đốc (Culture Fit)";

    const matchedCand = candidates.find((c) => c.name === candidateName || c.id === candidateId);

    addInterview({
      candidateId: matchedCand?.id || candidateId || `cand-${Date.now()}`,
      candidateName,
      candidateEmail: candidateEmail || matchedCand?.email || "candidate@email.com",
      candidatePhone: matchedCand?.phone || "0900000000",
      candidateAvatar: candidateName
        .split(" ")
        .map((w) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase(),
      jobTitle: jobTitle || matchedCand?.jobTarget || "Vị trí tuyển dụng",
      round,
      roundName,
      date,
      time,
      durationMinutes: parseInt(duration, 10) || 45,
      format,
      meetingUrlOrRoom:
        format === "onsite"
          ? "Phòng Họp Tầng 12"
          : "https://meet.google.com/rec-interview-room",
      interviewers: interviewers.split(",").map((s) => s.trim()).filter(Boolean),
      status: "scheduled",
      notes,
      score: matchedCand?.matchScore || 90,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lên Lịch Phỏng Vấn Ứng Viên</DialogTitle>
          <DialogDescription>
            Tạo buổi phỏng vấn cho {candidateName} ({jobTitle || "Ứng viên"}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSchedule} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Vòng Phỏng vấn</Label>
            <Select value={round} onValueChange={(val) => setRound(val as "screening" | "technical" | "final" | "culture")}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="screening">Vòng 1: Sơ vấn HR (30 phút)</SelectItem>
                <SelectItem value="technical">Vòng 2: Đánh giá Kỹ thuật (Technical 45-60 phút)</SelectItem>
                <SelectItem value="final">Vòng 3: Phỏng vấn Ban Giám Đốc (Culture Fit)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="int-date">Ngày phỏng vấn</Label>
              <Input
                id="int-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="int-time">Giờ bắt đầu</Label>
              <Input
                id="int-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Thời lượng</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Phút</SelectItem>
                  <SelectItem value="45">45 Phút</SelectItem>
                  <SelectItem value="60">60 Phút</SelectItem>
                  <SelectItem value="90">90 Phút</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Hình thức phỏng vấn</Label>
              <Select value={format} onValueChange={(val) => setFormat(val as "gmeet" | "zoom" | "onsite")}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmeet">Google Meet (Tự tạo link)</SelectItem>
                  <SelectItem value="zoom">Zoom Meeting</SelectItem>
                  <SelectItem value="onsite">Trực tiếp tại văn phòng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="int-interviewers">Người tham gia phỏng vấn (Hội đồng)</Label>
            <Input
              id="int-interviewers"
              value={interviewers}
              onChange={(e) => setInterviewers(e.target.value)}
              placeholder="Tech Lead, HR Lead..."
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="int-notes">Ghi chú & Trọng tâm đánh giá</Label>
            <Textarea
              id="int-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary border-border text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-sky-600 text-white hover:bg-sky-700 font-bold shadow-xs"
            >
              Xác Nhận Lịch Phỏng Vấn
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
