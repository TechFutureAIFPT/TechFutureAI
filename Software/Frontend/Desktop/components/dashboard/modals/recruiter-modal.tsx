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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSalesOps } from "@/lib/sales-ops-context";
import { type RecruiterMember } from "@/lib/mock-data";

interface RecruiterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recruiterToEdit?: RecruiterMember | null;
}

export function RecruiterModal({
  open,
  onOpenChange,
  recruiterToEdit,
}: RecruiterModalProps) {
  const { addRecruiter, updateRecruiter } = useSalesOps();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Tech & Product Hiring");
  const [hiringTarget, setHiringTarget] = useState("12");

  useEffect(() => {
    if (recruiterToEdit) {
      setName(recruiterToEdit.name);
      setRole(recruiterToEdit.role);
      setEmail(recruiterToEdit.email);
      setPhone(recruiterToEdit.phone);
      setDepartment(recruiterToEdit.department);
      setHiringTarget(recruiterToEdit.hiringTarget.toString());
    } else {
      setName("");
      setRole("Chuyên viên Tuyển dụng (Recruiter)");
      setEmail("");
      setPhone("");
      setDepartment("Tech & Product Hiring");
      setHiringTarget("12");
    }
  }, [recruiterToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numTarget = parseInt(hiringTarget) || 10;

    if (recruiterToEdit) {
      updateRecruiter(recruiterToEdit.id, {
        name,
        role,
        email,
        phone,
        department,
        hiringTarget: numTarget,
      });
    } else {
      addRecruiter({
        name,
        role,
        email,
        phone,
        department,
        hiringTarget: numTarget,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-bold">
            {recruiterToEdit
              ? "Cập Nhật Thông Tin Chuyên Viên Tuyển Dụng"
              : "Nhận Thêm Chuyên Viên Tuyển Dụng Mới"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {recruiterToEdit
              ? "Cập nhật chức danh, nhóm phụ trách và chỉ tiêu KPI tuyển dụng."
              : "Tiếp nhận và cấp quyền cho chuyên viên tuyển dụng mới tham gia xử lý hồ sơ ứng viên và quản lý phễu."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="rec-name" className="text-xs font-bold text-slate-800">Họ và Tên Chuyên Viên *</Label>
            <Input
              id="rec-name"
              required
              placeholder="Ví dụ: Lê Hoàng Nam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-50 border-slate-200 focus:bg-white text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rec-role" className="text-xs font-bold text-slate-800">Chức Danh Tuyển Dụng (Role) *</Label>
            <Input
              id="rec-role"
              required
              placeholder="Ví dụ: Senior Technical Recruiter / Talent Acquisition Specialist"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-slate-50 border-slate-200 focus:bg-white text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">Nhóm / Khối Tuyển Dụng Phụ Trách</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tech & Product Hiring" className="text-xs">Tech & Product Hiring (Công nghệ & Sản phẩm)</SelectItem>
                <SelectItem value="AI & Infrastructure Hiring" className="text-xs">AI & Infrastructure Hiring (AI & Hạ tầng)</SelectItem>
                <SelectItem value="Backend & Systems" className="text-xs">Backend & Systems (Hệ thống & Cloud)</SelectItem>
                <SelectItem value="Design & Marketing Hiring" className="text-xs">Design & Marketing Hiring (Thiết kế & Tiếp thị)</SelectItem>
                <SelectItem value="Executive Search" className="text-xs">Executive Search (Nhân sự Cấp cao & Quản lý)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rec-email" className="text-xs font-bold text-slate-800">Email Chuyên Viên *</Label>
              <Input
                id="rec-email"
                type="email"
                required
                placeholder="nam.le@supporthr.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-phone" className="text-xs font-bold text-slate-800">Số Điện Thoại</Label>
              <Input
                id="rec-phone"
                placeholder="0908 999 222"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rec-target" className="text-xs font-bold text-slate-800">Chỉ Tiêu Tuyển Dụng Quý (Hiring Target) *</Label>
            <Input
              id="rec-target"
              type="number"
              min="1"
              required
              value={hiringTarget}
              onChange={(e) => setHiringTarget(e.target.value)}
              className="bg-slate-50 border-slate-200 focus:bg-white text-xs"
            />
            <p className="text-[11px] text-muted-foreground">Số lượng ứng viên mục tiêu cần hoàn tất tuyển dụng trong kỳ.</p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-sky-600 text-white hover:bg-sky-700 font-bold shadow-xs text-xs"
            >
              {recruiterToEdit ? "Lưu Cập Nhật" : "Xác Nhận Nhận Chuyên Viên"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
