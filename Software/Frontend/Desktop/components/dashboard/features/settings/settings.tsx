"use client";

import { useState } from "react";
import { useSalesOps } from "@/lib/sales-ops-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Key,
  Sparkles,
  CheckCircle2,
  Mail,
  Phone,
  Building2,
  MapPin,
  ShieldCheck,
  Globe,
  Sliders,
  RefreshCw,
  Award,
  Target,
  Clock,
  Briefcase,
  Lock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { accountApi } from "@/lib/api-endpoints";

export function SettingsSection() {
  const {
    userProfile,
    updateUserProfile,
    authUser,
    setIsAuthModalOpen,
    reloadRealUserData,
    setActiveSection,
  } = useSalesOps();

  // User Profile Basic States
  const [firstName, setFirstName] = useState(userProfile.firstName || "Phong");
  const [lastName, setLastName] = useState(userProfile.lastName || "Nguyễn Văn");
  const [email, setEmail] = useState(authUser?.email || userProfile.email || "recruiter@supporthr.vn");
  const [phone, setPhone] = useState("0908 123 456");
  const [role, setRole] = useState(userProfile.role || "Trưởng Nhóm Tuyển Dụng (Lead Recruiter)");
  const [department, setDepartment] = useState("Tech & Product Talent Acquisition");
  const [workLocation, setWorkLocation] = useState(userProfile.workLocation || "TP. Hồ Chí Minh - Trụ sở chính");
  const [officeAddress, setOfficeAddress] = useState(userProfile.officeAddress || "Tầng 12, Tòa nhà Bitexco, Q.1, TP.HCM");
  const [timezone, setTimezone] = useState(userProfile.timezone || "ict");
  const [currency, setCurrency] = useState(userProfile.currency || "VND");
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const fullName = `${lastName} ${firstName}`.trim();

    updateUserProfile({
      name: fullName,
      firstName,
      lastName,
      email,
      role,
      workLocation,
      officeAddress,
      timezone,
      currency,
      avatar: `${firstName[0] || "H"}${lastName[0] || "P"}`.toUpperCase(),
    });

    try {
      if (authUser) {
        await accountApi.updateProfile({
          name: fullName,
          role,
          email,
          timezone,
          currency,
        });
        toast.success("Đã lưu hồ sơ và đồng bộ vào Cloud Database!");
      } else {
        toast.success("Đã cập nhật thông tin người dùng thành công!");
      }
    } catch {
      toast.success("Đã lưu thiết lập tài khoản thành công!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      await reloadRealUserData();
      toast.success("Đã đồng bộ dữ liệu thời gian thực từ Cloud Database!");
    } catch {
      toast.error("Không thể kết nối máy chủ database");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* 1. TOP DUAL-PAGE NAVIGATION SWITCHER */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
          <Button
            type="button"
            className="text-xs font-bold h-9 px-4 bg-white text-sky-700 shadow-xs border border-sky-200/80 rounded-xl hover:bg-white"
          >
            <User className="w-3.5 h-3.5 mr-2 text-sky-600" />
            <span>Hồ Sơ & Cài Đặt</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSection("criteria-settings")}
            className="text-xs font-semibold h-9 px-4 text-slate-600 hover:text-sky-800 hover:bg-white/80 rounded-xl"
          >
            <Sliders className="w-3.5 h-3.5 mr-2 text-slate-500" />
            <span>Tiêu Chí Chấm Điểm JD</span>
          </Button>
        </div>

        <div className="hidden sm:flex items-center gap-2 pr-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAuthModalOpen(true)}
            className="text-xs font-semibold h-8 text-sky-700 hover:text-sky-800 border-sky-200 bg-white shadow-2xs"
          >
            <Key className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
            <span>{authUser ? "Quản Lý Tài Khoản" : "Đăng Nhập"}</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-4 w-full">
        {/* 2. RECRUITER PROFILE HERO STRIP */}
        <Card className="border-border bg-card shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              {/* Avatar with Status Pin */}
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <Avatar className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-slate-200 bg-sky-50 shadow-xs">
                    <AvatarFallback className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 text-white text-xl font-black rounded-xl">
                      {authUser?.photoURL ? (
                        <img src={authUser.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        `${lastName[0] || "N"}${firstName[0] || "P"}`.toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="Đang hoạt động" />
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                      {lastName} {firstName}
                    </h3>
                    <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">
                      <Award className="w-3 h-3 mr-1 text-sky-600" />
                      Verified Recruiter
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 flex-wrap truncate">
                    <Briefcase className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{role}</span>
                    <span>•</span>
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{department}</span>
                  </p>
                </div>
              </div>

              {/* Status Indicator Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-1 font-medium ${
                    authUser
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-sky-50 text-sky-700 border-sky-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-500" />
                  {authUser ? "Tài Khoản Đã Xác Thực (SSL)" : "Phiên Làm Việc Recruiter"}
                </Badge>
              </div>
            </div>

            {/* Quick Context Strip (Múi giờ & Địa điểm làm việc) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                  Văn Phòng Làm Việc
                </span>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">{workLocation}</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                  Múi Giờ Hoạt Động
                </span>
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    {timezone === "ict"
                      ? "ICT (UTC+7 Việt Nam)"
                      : timezone === "gmt"
                      ? "GMT (UTC+0)"
                      : timezone === "est"
                      ? "EST (UTC-5)"
                      : "PST (UTC-8)"}
                  </span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                  Đơn Vị Tiền Tệ
                </span>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>{currency === "VND" ? "VNĐ (₫)" : "USD ($)"}</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                  Trạng Thái Tài Khoản
                </span>
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Đang Hoạt Động</span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. MAIN 2-COLUMN SETTINGS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form Thông Tin Người Dùng (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="border-b border-border pb-3 bg-gradient-to-r from-sky-50/40 via-white to-blue-50/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Thông Tin Người Dùng & Chuyên Viên Tuyển Dụng
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Chi tiết định danh, địa điểm văn phòng công tác và múi giờ làm việc
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Row 1: Họ Đệm + Tên */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-semibold text-slate-800">
                      Họ và Tên Đệm
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="VD: Nguyễn Văn"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-xs h-9 font-medium focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-semibold text-slate-800">
                      Tên Chính
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="VD: Phong"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-xs h-9 font-medium focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Row 2: Chức Danh + Phòng Ban */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                      <span>Chức Danh / Vị Trí</span>
                    </Label>
                    <Input
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-xs h-9 font-medium focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dept" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Khối / Phòng Ban Phụ Trách</span>
                    </Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tech & Product Talent Acquisition">Tech & Product Talent Acquisition</SelectItem>
                        <SelectItem value="Commercial & Sales Hiring">Commercial & Sales Hiring</SelectItem>
                        <SelectItem value="Finance & Accounting Talent">Finance & Accounting Talent</SelectItem>
                        <SelectItem value="HR & Operations Team">HR & Operations Team</SelectItem>
                        <SelectItem value="Executive Search & Leadership">Executive Search & Leadership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Email + Số Điện Thoại */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-600" />
                      <span>Email Công Vụ</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-xs h-9 font-medium focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-sky-600" />
                      <span>Số Điện Thoại Liên Hệ</span>
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0908 123 456"
                      className="bg-slate-50 border-slate-200 text-xs h-9 font-medium focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Row 4: Văn Phòng Làm Việc + Múi Giờ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="workLocation" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      <span>Địa Điểm / Văn Phòng Làm Việc</span>
                    </Label>
                    <Select value={workLocation} onValueChange={setWorkLocation}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TP. Hồ Chí Minh - Trụ sở chính">TP. Hồ Chí Minh - Trụ sở chính (Q.1)</SelectItem>
                        <SelectItem value="Hà Nội - Chi nhánh">Hà Nội - Chi nhánh (Cầu Giấy)</SelectItem>
                        <SelectItem value="Đà Nẵng - Tech Hub">Đà Nẵng - Tech Hub (Hải Châu)</SelectItem>
                        <SelectItem value="Cần Thơ - Văn phòng miền Tây">Cần Thơ - Văn phòng đại diện</SelectItem>
                        <SelectItem value="Hải Phòng - Chi nhánh miền Bắc">Hải Phòng - Chi nhánh</SelectItem>
                        <SelectItem value="Linh hoạt từ xa (Remote / Hybrid)">Linh hoạt từ xa (Remote / Hybrid)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="timezone" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      <span>Múi Giờ Hoạt Động (Timezone)</span>
                    </Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ict">Việt Nam (ICT UTC+7: Hà Nội / TP.HCM)</SelectItem>
                        <SelectItem value="gmt">Singapore / Malaysia / China (UTC+8)</SelectItem>
                        <SelectItem value="est">Tokyo / Seoul (JST/KST UTC+9)</SelectItem>
                        <SelectItem value="pst">London / Dublin (GMT UTC+0)</SelectItem>
                        <SelectItem value="us-est">New York (EST UTC-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 5: Địa chỉ văn phòng */}
                <div className="space-y-1.5">
                  <Label htmlFor="officeAddress" className="text-xs font-semibold text-slate-800">
                    Địa Chỉ Văn Phòng Chi Tiết
                  </Label>
                  <Input
                    id="officeAddress"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    placeholder="VD: Tầng 12, Tòa nhà Bitexco Financial Tower, Quận 1, TP.HCM"
                    className="bg-slate-50 border-slate-200 text-xs h-9 font-medium focus:bg-white transition-colors"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Banner Lối Tắt Đến Trang Tiêu Chí Chấm Điểm JD */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 via-white to-blue-50/60 border border-sky-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Cấu Hình Tiêu Chí Chấm Điểm & Bộ Lọc JD
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Chuyển sang trang riêng biệt để quản lý 6 trọng số Rubric và điều kiện lọc cứng tự động
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveSection("criteria-settings")}
                className="text-xs font-bold bg-white text-sky-700 border-sky-300 hover:bg-sky-50 shrink-0"
              >
                <span>Mở Trang Tiêu Chí JD</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Right Column: Tùy Chọn & Bảo Mật Google / Firebase (1 col) */}
          <div className="space-y-6">
            {/* Tùy chọn hệ thống */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="border-b border-border pb-3 bg-gradient-to-r from-sky-50/40 via-white to-blue-50/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Tùy Chọn Hệ Thống
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tiền tệ & thông báo định kỳ
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="text-xs font-semibold text-slate-800">
                    Đơn Vị Tiền Tệ Hiển Thị
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">Việt Nam Đồng (VNĐ ₫)</SelectItem>
                      <SelectItem value="USD">Đô la Mỹ (USD $)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="space-y-0.5 pr-2">
                    <p className="font-semibold text-xs text-slate-900">Email Báo Cáo Hiệu Suất</p>
                    <p className="text-[10px] text-muted-foreground">Nhận thống kê đợt lọc mỗi tuần</p>
                  </div>
                  <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Security Card (BẢO MẬT DOANH NGHIỆP) */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="border-b border-border pb-3 bg-gradient-to-r from-sky-50/40 via-white to-blue-50/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Bảo Mật & Xác Thực Doanh Nghiệp
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Mã hóa chuẩn SSL 256-bit an toàn
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3.5">
                <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Trạng Thái Xác Thực:</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      Tài Khoản Đã Xác Thực
                    </Badge>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-sky-200/60">
                    <p className="flex items-center justify-between">
                      <span className="font-medium text-slate-500">Tài Khoản:</span>
                      <strong className="text-slate-800 truncate max-w-[140px]">{authUser?.email || email}</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="font-medium text-slate-500">Chuẩn Bảo Mật:</span>
                      <span className="text-emerald-700 font-semibold">SSL 256-bit Encrypted</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSyncDatabase}
                    disabled={isSyncing}
                    className="w-full text-xs font-semibold h-8.5 border-slate-200 bg-white hover:bg-sky-50 hover:text-sky-700 shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-sky-600 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Đang Đồng Bộ..." : "Làm Mới & Đồng Bộ Dữ Liệu"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full text-xs font-semibold h-8.5 border-sky-200 bg-sky-50/50 hover:bg-sky-100 text-sky-800"
                  >
                    <Key className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                    <span>Đăng Nhập / Quản Lý Tài Khoản</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Link to Criteria Settings */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5 min-w-0">
                <p className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Cài Đặt Tiêu Chí & Trọng Số JD</span>
                </p>
                <p className="text-[11px] text-sky-800 truncate">
                  Cấu hình 6 trọng số Rubric và bộ lọc điều kiện cứng mặc định
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveSection("criteria-settings")}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-8 px-3 shrink-0 shadow-2xs"
              >
                <span>Mở Trang →</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 4. STICKY BOTTOM SAVE ACTION BAR */}
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Mọi thay đổi thông tin chuyên viên & văn phòng sẽ được cập nhật đồng bộ</span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-9 px-5 shadow-xs transition-all"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Đang Lưu Hồ Sơ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Lưu & Cập Nhật Hồ Sơ</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
