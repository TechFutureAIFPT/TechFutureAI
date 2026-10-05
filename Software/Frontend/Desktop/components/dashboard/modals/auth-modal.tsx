"use client";

import { useState } from "react";
import { useSalesOps } from "@/lib/sales-ops-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  signInWithEmail,
  signInWithGoogle,
  registerWithEmail,
  sendPasswordReset,
  mapAuthError,
} from "@/lib/firebase";
import { LogIn, UserPlus, Sparkles, CheckCircle2, Shield, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { authUser, reloadRealUserData, logoutUser } = useSalesOps();

  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      toast.success(`Đăng nhập thành công với tài khoản ${user.email}!`);
      await reloadRealUserData();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ email và mật khẩu");
      return;
    }
    setIsLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      toast.success(`Đăng nhập thành công với tài khoản ${user.email}!`);
      await reloadRealUserData();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ email và mật khẩu");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có tối thiểu 6 ký tự");
      return;
    }
    setIsLoading(true);
    try {
      const user = await registerWithEmail(email, password, displayName);
      toast.success(`Đăng ký tài khoản thành công cho ${user.email}!`);
      await reloadRealUserData();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email nhận liên kết đặt lại mật khẩu");
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      toast.success("Đã gửi email hướng dẫn đặt lại mật khẩu!");
      setActiveTab("login");
    } catch (err: unknown) {
      toast.error(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-white border-border shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center p-2 border border-border">
            <img src="/brand/cvmatch-icon.png" alt="CV Match" className="w-full h-full object-contain" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {authUser ? "Tài Khoản Tuyển Dụng Support HR" : "Đăng Nhập CV Match"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {authUser
              ? "Tài khoản thực tế đang kết nối an toàn với máy chủ đám mây"
              : "Đăng nhập với Tài khoản Google để đồng bộ dữ liệu tuyển dụng trực tiếp"}
          </DialogDescription>
        </DialogHeader>

        {authUser ? (
          /* Already Signed In */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
                  {(authUser.displayName || authUser.email || "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {authUser.displayName || "Chuyên Viên Tuyển Dụng"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{authUser.email}</p>
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] mt-1 font-bold">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                    Google Cloud Live Session (Bảo Mật SSL)
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await reloadRealUserData();
                  toast.success("Đã đồng bộ lại dữ liệu mới nhất từ máy chủ!");
                }}
                className="flex-1 text-xs border-slate-200 hover:bg-sky-50 hover:text-sky-700"
              >
                Đồng Bộ Lại Database
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await logoutUser();
                  toast.info("Đã đăng xuất tài khoản");
                  onOpenChange(false);
                }}
                className="text-xs font-semibold"
              >
                Đăng Xuất
              </Button>
            </div>
          </div>
        ) : (
          /* Sign In / Register Tabs */
          <div className="space-y-4 py-2">
            {/* 1-Click Google Sign In */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-10 text-xs font-bold border-slate-200 bg-white hover:bg-sky-50 flex items-center justify-center gap-2.5 shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Tiếp Tục Với Tài Khoản Google</span>
            </Button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-border w-full" />
              <span className="bg-white px-2 text-[11px] text-muted-foreground uppercase font-semibold absolute">
                Hoặc email
              </span>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register" | "forgot")}>
              <TabsList className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="login" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-sky-700">
                  Đăng Nhập
                </TabsTrigger>
                <TabsTrigger value="register" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-sky-700">
                  Tạo Tài Khoản
                </TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login" className="space-y-3 pt-3">
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-900">Email Công Ty</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ten@supporthr.vn"
                      className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-900">Mật Khẩu</Label>
                      <button
                        type="button"
                        onClick={() => setActiveTab("forgot")}
                        className="text-[11px] text-sky-600 hover:underline cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold h-9 mt-2 shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                    {isLoading ? "Đang Xác Thực..." : "Đăng Nhập Hệ Thống"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register" className="space-y-3 pt-3">
                <form onSubmit={handleEmailRegister} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-900">Họ và Tên</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-900">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ten@supporthr.vn"
                      className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-900">Mật Khẩu (Tối thiểu 6 ký tự)</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold h-9 mt-2 shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    {isLoading ? "Đang Tạo Tài Khoản..." : "Đăng Ký Tài Khoản"}
                  </Button>
                </form>
              </TabsContent>

              {/* Forgot Password */}
              <TabsContent value="forgot" className="space-y-3 pt-3">
                <form onSubmit={handlePasswordReset} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-900">Email Nhận Hướng Dẫn Đặt Lại</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ten@supporthr.vn"
                      className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold h-9 mt-2 shadow-xs"
                  >
                    {isLoading ? "Đang Gửi..." : "Gửi Email Đặt Lại Mật Khẩu"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="w-full text-center text-xs text-muted-foreground hover:text-sky-600 mt-2 cursor-pointer"
                  >
                    &larr; Quay lại đăng nhập
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
