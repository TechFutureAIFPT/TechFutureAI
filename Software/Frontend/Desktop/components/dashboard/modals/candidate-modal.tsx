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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSalesOps } from "@/lib/sales-ops-context";
import { type Candidate } from "@/lib/mock-data";

interface CandidateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateToEdit?: Candidate | null;
  defaultStage?: Candidate["stage"];
}

export function CandidateModal({
  open,
  onOpenChange,
  candidateToEdit,
  defaultStage = "screening",
}: CandidateModalProps) {
  const { addCandidate, updateCandidate, jobs, recruiters } = useSalesOps();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTarget, setJobTarget] = useState("");
  const [matchScore, setMatchScore] = useState("85");
  const [stage, setStage] = useState<Candidate["stage"]>(defaultStage);
  const [status, setStatus] = useState<Candidate["status"]>("active");
  const [experienceYears, setExperienceYears] = useState("3");
  const [expectedSalary, setExpectedSalary] = useState("25000000");
  const [skillsText, setSkillsText] = useState("React, TypeScript, Tailwind CSS");
  const [education, setEducation] = useState("Đại học Bách Khoa");
  const [location, setLocation] = useState("TP. Hồ Chí Minh");
  const [recruiter, setRecruiter] = useState("");
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    if (candidateToEdit) {
      setName(candidateToEdit.name);
      setEmail(candidateToEdit.email);
      setPhone(candidateToEdit.phone);
      setJobTarget(candidateToEdit.jobTarget);
      setMatchScore(candidateToEdit.matchScore.toString());
      setStage(candidateToEdit.stage);
      setStatus(candidateToEdit.status);
      setExperienceYears(candidateToEdit.experienceYears.toString());
      setExpectedSalary(candidateToEdit.expectedSalary.toString());
      setSkillsText(candidateToEdit.skills.join(", "));
      setEducation(candidateToEdit.education);
      setLocation(candidateToEdit.location);
      setRecruiter(candidateToEdit.recruiter);
      setAiSummary(candidateToEdit.aiSummary || "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setJobTarget(jobs[0]?.title || "Senior Frontend React/Vue Developer");
      setMatchScore("85");
      setStage(defaultStage);
      setStatus("active");
      setExperienceYears("3");
      setExpectedSalary("25000000");
      setSkillsText("ReactJS, TypeScript, Tailwind CSS");
      setEducation("Đại học Bách Khoa");
      setLocation("TP. Hồ Chí Minh");
      setRecruiter(recruiters[0]?.name || "Nguyễn Thị Mai");
      setAiSummary("Hồ sơ đáp ứng tốt các yêu cầu kỹ thuật chính của vị trí.");
    }
  }, [candidateToEdit, defaultStage, open, jobs, recruiters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const candData = {
      name,
      email,
      phone,
      jobTarget,
      matchScore: parseInt(matchScore) || 75,
      stage,
      status,
      experienceYears: parseFloat(experienceYears) || 1,
      expectedSalary: parseFloat(expectedSalary) || 20000000,
      skills,
      education,
      location,
      recruiter,
      appliedDate: new Date().toISOString().split("T")[0],
      aiSummary,
      interviewQuestions: [
        "Trình bày dự án phức tạp nhất bạn từng triển khai với công nghệ này?",
        "Cách bạn giải quyết xung đột ý kiến kỹ thuật trong nhóm?",
      ],
    };

    if (candidateToEdit) {
      updateCandidate(candidateToEdit.id, candData);
    } else {
      addCandidate(candData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-10">
          <DialogTitle>
            {candidateToEdit ? "Chỉnh sửa Hồ sơ Ứng viên" : "Tiếp nhận & Chấm điểm Hồ sơ CV Mới"}
          </DialogTitle>
          <DialogDescription>
            {candidateToEdit
              ? "Cập nhật kết quả đối chiếu, kinh nghiệm và thông tin liên hệ."
              : "Thêm hồ sơ ứng viên vào hệ thống chấm điểm và phân tích AI CV Match."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cand-name">Họ và Tên Ứng viên *</Label>
              <Input
                id="cand-name"
                required
                placeholder="Ví dụ: Nguyễn Văn An"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cand-job">Vị trí Ứng tuyển *</Label>
              <Select value={jobTarget} onValueChange={setJobTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.title}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cand-email">Địa chỉ Email</Label>
              <Input
                id="cand-email"
                type="email"
                placeholder="ungvien@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cand-phone">Số Điện thoại</Label>
              <Input
                id="cand-phone"
                placeholder="0908 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cand-score">Điểm Match AI (%)</Label>
              <Input
                id="cand-score"
                type="number"
                min="0"
                max="100"
                value={matchScore}
                onChange={(e) => setMatchScore(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cand-exp">Kinh nghiệm (Năm)</Label>
              <Input
                id="cand-exp"
                type="number"
                step="0.5"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cand-sal">Lương Mong muốn (₫)</Label>
              <Input
                id="cand-sal"
                type="number"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Giai đoạn Phễu</Label>
              <Select
                value={stage}
                onValueChange={(val: Candidate["stage"]) => setStage(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screening">Sơ loại CV</SelectItem>
                  <SelectItem value="qualified">Đạt chuẩn (≥ 75%)</SelectItem>
                  <SelectItem value="interview">Phỏng vấn</SelectItem>
                  <SelectItem value="offer">Đề nghị nhận việc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select
                value={status}
                onValueChange={(val: Candidate["status"]) => setStatus(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang xử lý</SelectItem>
                  <SelectItem value="hired">Đã nhận việc</SelectItem>
                  <SelectItem value="rejected">Không phù hợp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Chuyên viên Tuyển dụng</Label>
              <Select value={recruiter} onValueChange={setRecruiter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recruiters.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cand-skills">Kỹ năng chuyên môn (cách nhau bởi dấu phẩy)</Label>
            <Input
              id="cand-skills"
              placeholder="React, TypeScript, NodeJS, Docker..."
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cand-edu">Học vấn / Bằng cấp</Label>
              <Input
                id="cand-edu"
                placeholder="Đại học Bách Khoa..."
                value={education}
                onChange={(e) => setEducation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cand-loc">Khu vực / Địa điểm</Label>
              <Input
                id="cand-loc"
                placeholder="Hà Nội / TP.HCM / Đà Nẵng..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cand-summary">Tóm tắt Đánh giá AI Matching</Label>
            <Textarea
              id="cand-summary"
              rows={3}
              placeholder="Điểm mạnh, độ phù hợp kỹ năng và kinh nghiệm thực chiến..."
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
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
              {candidateToEdit ? "Lưu Thay Đổi" : "Tiếp Nhận CV"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
