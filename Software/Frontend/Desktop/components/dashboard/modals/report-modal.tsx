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
import { Checkbox } from "@/components/ui/checkbox";
import { useSalesOps } from "@/lib/sales-ops-context";
import { toast } from "sonner";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportModal({ open, onOpenChange }: ReportModalProps) {
  const { historyBatches, exportBatchReportCsv, candidates } = useSalesOps();

  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [includeRubric, setIncludeRubric] = useState(true);
  const [includeQuestions, setIncludeQuestions] = useState(true);
  const [includeAiSummary, setIncludeAiSummary] = useState(true);
  const [format, setFormat] = useState<"CSV" | "XLSX">("CSV");
  const [notes, setNotes] = useState(
    "Báo cáo xuất dữ liệu chi tiết bảng điểm đối chiếu AI, 6 tiêu chuẩn rubric và danh sách ứng viên theo phiên lọc."
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedBatchId !== "all") {
      exportBatchReportCsv(selectedBatchId);
    } else {
      let csvRows = [
        "ID,Họ Tên Ứng Viên,Email,Số Điện Thoại,Vị Trí Tuyển Dụng,Điểm Match AI,Kinh Nghiệm (Năm),Lương Mong Muốn,Trạng Thái,Giai Đoạn",
      ];
      if (includeRubric) {
        csvRows[0] += ",Điểm Kỹ Năng,Điểm Kinh Nghiệm,Điểm Học Vấn,Điểm Kỹ Năng Mềm";
      }
      if (includeAiSummary) {
        csvRows[0] += ",Tóm Tắt Nhận Xét AI";
      }

      candidates.forEach((c) => {
        let row = `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.jobTarget}",${c.matchScore}%,${c.experienceYears},${c.expectedSalary},"${c.status}","${c.stage}"`;
        if (includeRubric) {
          row += `,${c.criteriaScores?.skills || 80},${c.criteriaScores?.experience || 75},${c.criteriaScores?.education || 80},${c.criteriaScores?.softSkills || 85}`;
        }
        if (includeAiSummary) {
          row += `,"${(c.aiSummary || "").replace(/"/g, '""')}"`;
        }
        csvRows.push(row);
      });

      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bao_cao_phien_loc_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất báo cáo dữ liệu phiên lọc ra file CSV!");
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tùy Biến Báo Cáo Dữ Liệu Phiên Lọc</DialogTitle>
          <DialogDescription>
            Chọn phiên lọc hồ sơ và các trường thông tin cần xuất ra file CSV.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Chọn Phiên Lọc Hồ Sơ Cần Xuất</Label>
            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các phiên lọc (Tổng hợp toàn bộ)</SelectItem>
                {historyBatches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.batchName} ({b.totalCVs} CV - {b.createdAt})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Định Dạng Tệp Xuất</Label>
            <Select value={format} onValueChange={(v: "CSV" | "XLSX") => setFormat(v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">Bảng tính CSV (Hỗ trợ mở bằng Excel / Google Sheets)</SelectItem>
                <SelectItem value="XLSX">Excel Workbook (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Các Trường Dữ Liệu Bao Gồm</Label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={includeRubric}
                  onCheckedChange={(c) => setIncludeRubric(!!c)}
                />
                <span>Điểm chi tiết 6 Trọng số Rubric (Kỹ năng, Kinh nghiệm, Học vấn, Kỹ năng mềm...)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={includeAiSummary}
                  onCheckedChange={(c) => setIncludeAiSummary(!!c)}
                />
                <span>Bóc tách bằng chứng thực tế & Tóm tắt nhận xét AI</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={includeQuestions}
                  onCheckedChange={(c) => setIncludeQuestions(!!c)}
                />
                <span>Bộ câu hỏi phỏng vấn đề xuất theo năng lực ứng viên</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rep-summary">Ghi Chú Báo Cáo</Label>
            <Textarea
              id="rep-summary"
              rows={2}
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
              Tải Xuất File Báo Cáo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
