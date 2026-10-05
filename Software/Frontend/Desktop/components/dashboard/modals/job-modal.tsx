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
import { type JobPosition } from "@/lib/mock-data";

interface JobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobToEdit?: JobPosition | null;
}

export function JobModal({ open, onOpenChange, jobToEdit }: JobModalProps) {
  const { addJob, updateJob, recruiters } = useSalesOps();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [level, setLevel] = useState<JobPosition["level"]>("Senior");
  const [location, setLocation] = useState("TP. Hồ Chí Minh");
  const [openings, setOpenings] = useState("2");
  const [salaryRange, setSalaryRange] = useState("30,000,000 - 45,000,000 ₫");
  const [status, setStatus] = useState<JobPosition["status"]>("active");
  const [deadline, setDeadline] = useState("");
  const [recruiter, setRecruiter] = useState("");
  const [requirementsText, setRequirementsText] = useState("");

  const [jobFitWeight, setJobFitWeight] = useState("20");
  const [skillWeight, setSkillWeight] = useState("35");
  const [expWeight, setExpWeight] = useState("20");
  const [impactWeight, setImpactWeight] = useState("10");
  const [eduWeight, setEduWeight] = useState("5");
  const [softWeight, setSoftWeight] = useState("10");

  useEffect(() => {
    if (jobToEdit) {
      setTitle(jobToEdit.title);
      setDepartment(jobToEdit.department);
      setLevel(jobToEdit.level);
      setLocation(jobToEdit.location);
      setOpenings(jobToEdit.openings.toString());
      setSalaryRange(jobToEdit.salaryRange);
      setStatus(jobToEdit.status);
      setDeadline(jobToEdit.deadline);
      setRecruiter(jobToEdit.recruiter);
      setRequirementsText(jobToEdit.requirements.join("\n"));
      setJobFitWeight((jobToEdit.rubricWeights?.job_fit ?? 20).toString());
      setSkillWeight((jobToEdit.rubricWeights?.role_skills ?? 35).toString());
      setExpWeight((jobToEdit.rubricWeights?.experience ?? 20).toString());
      setImpactWeight((jobToEdit.rubricWeights?.impact ?? 10).toString());
      setEduWeight((jobToEdit.rubricWeights?.education ?? 5).toString());
      setSoftWeight((jobToEdit.rubricWeights?.soft_skills ?? 10).toString());
    } else {
      setTitle("");
      setDepartment("Engineering");
      setLevel("Senior");
      setLocation("TP. Hồ Chí Minh");
      setOpenings("2");
      setSalaryRange("30,000,000 - 45,000,000 ₫");
      setStatus("active");
      setDeadline(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      );
      setRecruiter(recruiters[0]?.name || "Nguyễn Thị Mai");
      setRequirementsText(
        "Tối thiểu 3 năm kinh nghiệm trong lĩnh vực liên quan\nThành thạo các công cụ và ngôn ngữ chuyên môn\nTư duy làm việc nhóm và giao tiếp tốt"
      );
      setJobFitWeight("20");
      setSkillWeight("35");
      setExpWeight("20");
      setImpactWeight("10");
      setEduWeight("5");
      setSoftWeight("10");
    }
  }, [jobToEdit, open, recruiters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const requirements = requirementsText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const jobData = {
      title,
      department,
      level,
      location,
      openings: parseInt(openings) || 1,
      salaryRange,
      status,
      deadline,
      recruiter,
      requirements,
      rubricWeights: {
        job_fit: parseInt(jobFitWeight) || 20,
        role_skills: parseInt(skillWeight) || 35,
        experience: parseInt(expWeight) || 20,
        impact: parseInt(impactWeight) || 10,
        education: parseInt(eduWeight) || 5,
        soft_skills: parseInt(softWeight) || 10,
      },
    };

    if (jobToEdit) {
      updateJob(jobToEdit.id, jobData);
    } else {
      addJob(jobData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-10">
          <DialogTitle>
            {jobToEdit ? "Chỉnh sửa Mô tả Công việc (JD)" : "Tạo Vị trí Tuyển dụng (JD) Mới"}
          </DialogTitle>
          <DialogDescription>
            {jobToEdit
              ? "Cập nhật tiêu chí yêu cầu, mức lương và bộ trọng số đối chiếu AI."
              : "Khởi tạo chiến dịch tuyển dụng và thiết lập trọng số chấm điểm CV tự động."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="job-title">Tên Vị trí Tuyển dụng (Job Title) *</Label>
            <Input
              id="job-title"
              required
              placeholder="Ví dụ: Senior Backend Python / FastAPI Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Phòng ban</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="AI Research">AI Research</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="HR & Operations">HR & Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Cấp bậc</Label>
              <Select
                value={level}
                onValueChange={(val: JobPosition["level"]) => setLevel(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Team Lead</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job-openings">Chỉ tiêu (Người)</Label>
              <Input
                id="job-openings"
                type="number"
                min="1"
                value={openings}
                onChange={(e) => setOpenings(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="job-salary">Mức lương đề xuất</Label>
              <Input
                id="job-salary"
                placeholder="25,000,000 - 40,000,000 ₫"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-loc">Địa điểm làm việc</Label>
              <Input
                id="job-loc"
                placeholder="TP.HCM / Hà Nội / Hybrid..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="job-deadline">Hạn chót tuyển dụng</Label>
              <Input
                id="job-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Chuyên viên phụ trách</Label>
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

          {/* AI Rubric Weights */}
          <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-sky-700 uppercase tracking-wider block">
                6 Trọng số Chấm điểm AI Rubric (%)
              </Label>
              {(() => {
                const sum =
                  (parseInt(jobFitWeight) || 0) +
                  (parseInt(skillWeight) || 0) +
                  (parseInt(expWeight) || 0) +
                  (parseInt(impactWeight) || 0) +
                  (parseInt(eduWeight) || 0) +
                  (parseInt(softWeight) || 0);
                return (
                  <span className={`text-[11px] font-bold ${sum === 100 ? "text-sky-700" : "text-destructive"}`}>
                    Tổng: {sum}% {sum === 100 ? "(Chuẩn 100%)" : "(Chưa đủ 100%)"}
                  </span>
                );
              })()}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block mb-1 truncate">Job Fit (%)</span>
                <Input
                  type="number"
                  value={jobFitWeight}
                  onChange={(e) => setJobFitWeight(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 truncate">Chuyên môn (%)</span>
                <Input
                  type="number"
                  value={skillWeight}
                  onChange={(e) => setSkillWeight(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 truncate">Kinh nghiệm (%)</span>
                <Input
                  type="number"
                  value={expWeight}
                  onChange={(e) => setExpWeight(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 truncate">Dự án & Impact (%)</span>
                <Input
                  type="number"
                  value={impactWeight}
                  onChange={(e) => setImpactWeight(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 truncate">Học vấn (%)</span>
                <Input
                  type="number"
                  value={eduWeight}
                  onChange={(e) => setEduWeight(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 truncate">Kỹ năng mềm (%)</span>
                <Input
                  type="number"
                  value={softWeight}
                  onChange={(e) => setSoftWeight(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-reqs">Yêu cầu Công việc (mỗi dòng một tiêu chí)</Label>
            <Textarea
              id="job-reqs"
              rows={4}
              placeholder="Nhập các yêu cầu kỹ thuật chính để AI trích xuất và đối chiếu..."
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              className="bg-slate-50 border-slate-200 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 hover:bg-sky-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-sky-600 text-white hover:bg-sky-700 font-bold shadow-xs"
            >
              {jobToEdit ? "Lưu Vị Trí JD" : "Tạo Chiến Dịch JD"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
