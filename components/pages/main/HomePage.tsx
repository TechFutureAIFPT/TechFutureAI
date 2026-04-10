import React, { useEffect, useMemo, useState, useRef } from "react";
import ChatBubble from "../../shared/ChatBubble";
import type { AppStep } from "../../../assets/types";
import { analysisCacheService } from "../../../services/history-cache/analysisCache";
import { cvFilterHistoryService } from "../../../services/history-cache/analysisHistory";
import type { ComparisonCell } from "./home/comparison";

const flowOrder: AppStep[] = ["jd", "weights", "upload", "analysis"];

const partners = [
  { name: "FPT", logo: "/images/logos/fpt.png" },
  { name: "TopCV", logo: "/images/logos/topcv-1.png" },
  { name: "Vinedimex", logo: "/images/logos/vinedimex-1.png" },
  { name: "HB", logo: "/images/logos/hb.png" },
  { name: "Mì AI", logo: "/images/logos/mi_ai.png" },
  { name: "2.1 Studio", logo: "/images/logos/2.1.png" },
];

const techStack = [
  { name: "Tailwind CSS", icon: "fa-brands fa-css3-alt", color: "text-[#38bdf8]" },
  { name: "Python", icon: "fa-brands fa-python", color: "text-[#ffd343]" },
  { name: "Gemini AI", icon: "fa-solid fa-brain", color: "text-[#8e75ff]" },
  { name: "Firebase", icon: "fa-solid fa-fire", color: "text-[#ff9100]" },
  { name: "React", icon: "fa-brands fa-react", color: "text-[#00d8ff]" },
  { name: "TypeScript", icon: "fa-brands fa-js", color: "text-[#3178c6]" },
];

const comparisonRows = [
  { icon: "fa-solid fa-layer-group", label: "Xử lý hàng loạt CV", chatgpt: { status: "negative" as const, text: "Chỉ 1 CV/lần" }, support: { status: "positive" as const, text: "Hàng trăm CV cùng lúc" } },
  { icon: "fa-solid fa-bullseye", label: "Độ chính xác AI", chatgpt: { status: "neutral" as const, text: "~70% · AI tổng quát" }, support: { status: "positive" as const, text: "95%+ · AI chuyên HR" } },
  { icon: "fa-solid fa-briefcase", label: "Phân tích kinh nghiệm", chatgpt: { status: "negative" as const, text: "Đọc text cơ bản" }, support: { status: "positive" as const, text: "Deep learning ngành" } },
  { icon: "fa-solid fa-image", label: "Đọc CV ảnh/scan", chatgpt: { status: "negative" as const, text: "Không hỗ trợ" }, support: { status: "positive" as const, text: "OCR đa định dạng" } },
  { icon: "fa-solid fa-industry", label: "Nhận diện ngành nghề", chatgpt: { status: "negative" as const, text: "Thủ công" }, support: { status: "positive" as const, text: "Tự động từ JD" } },
  { icon: "fa-solid fa-sliders", label: "Tùy chỉnh trọng số", chatgpt: { status: "negative" as const, text: "Không có" }, support: { status: "positive" as const, text: "UI trực quan" } },
  { icon: "fa-solid fa-chart-line", label: "Dashboard phân tích", chatgpt: { status: "negative" as const, text: "Chỉ chat text" }, support: { status: "positive" as const, text: "Biểu đồ chi tiết" } },
  { icon: "fa-solid fa-microphone-lines", label: "Câu hỏi phỏng vấn", chatgpt: { status: "neutral" as const, text: "Prompt thủ công" }, support: { status: "positive" as const, text: "Tự động CV+JD" } },
  { icon: "fa-solid fa-dollar-sign", label: "Phân tích mức lương", chatgpt: { status: "negative" as const, text: "Không có" }, support: { status: "positive" as const, text: "Benchmark vị trí" } },
  { icon: "fa-solid fa-rotate", label: "Lưu lịch sử", chatgpt: { status: "negative" as const, text: "Giới hạn" }, support: { status: "positive" as const, text: "Vĩnh viễn" } },
  { icon: "fa-solid fa-users", label: "Làm việc nhóm", chatgpt: { status: "negative" as const, text: "Không workspace" }, support: { status: "positive" as const, text: "Multi-user" } },
  { icon: "fa-solid fa-money-bill-trend-up", label: "Chi phí & hiệu quả", chatgpt: { status: "neutral" as const, text: "$20/tháng · Vẫn thủ công nhiều" }, support: { status: "highlight" as const, text: "Liên hệ · Tiết kiệm 70%" }, emphasis: true },
];

const statusStyles: Record<ComparisonCell["status"], { icon: string; badgeClass: string; textClass: string }> = {
  positive: { icon: "fa-solid fa-check", badgeClass: "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200", textClass: "text-slate-100" },
  negative: { icon: "fa-solid fa-xmark", badgeClass: "border border-rose-500/40 bg-rose-500/10 text-rose-200", textClass: "text-slate-300" },
  neutral: { icon: "fa-solid fa-minus", badgeClass: "border border-amber-500/30 bg-amber-500/10 text-amber-200", textClass: "text-slate-200" },
  highlight: { icon: "fa-solid fa-star", badgeClass: "border border-cyan-500/40 bg-gradient-to-r from-cyan-500/30 to-emerald-500/20 text-white", textClass: "text-white font-semibold" },
};

const navLinks = [
  { label: "Tính năng", href: "#features" },
  { label: "Quy trình", href: "#steps" },
  { label: "So sánh", href: "#compare" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "Liên hệ", href: "#contact" },
];

const features = [
  {
    icon: "fa-solid fa-brain-circuit",
    title: "AI Phân Tích Sâu",
    desc: "Gemini AI phân tích CV theo ngữ cảnh ngành nghề, kinh nghiệm và kỹ năng mềm.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: "fa-solid fa-layer-group",
    title: "Xử Lý Hàng Loạt",
    desc: "Upload đồng thời 20 CV. AI phân tích toàn bộ chỉ trong 2 phút.",
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: "fa-solid fa-sliders",
    title: "Tùy Chỉnh Linh Hoạt",
    desc: "Cấu hình trọng số và bộ lọc cứng theo nhu cầu tuyển dụng riêng của bạn.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: "fa-solid fa-chart-pie",
    title: "Dashboard Trực Quan",
    desc: "Biểu đồ, bảng điểm và xếp hạng ứng viên trực tiếp trên giao diện.",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: "fa-solid fa-wand-magic-sparkles",
    title: "Câu Hỏi Phỏng Vấn",
    desc: "Tự động sinh câu hỏi chuyên sâu phù hợp từng ứng viên và vị trí tuyển dụng.",
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    iconColor: "text-pink-400",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "Bảo Mật & Riêng Tư",
    desc: "Dữ liệu được mã hóa, lưu trữ an toàn. Chỉ bạn mới có quyền truy cập.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
];

const steps = [
  {
    num: "01",
    icon: "fa-solid fa-file-pen",
    title: "Nhập Job Description",
    desc: "Dán JD hoặc tải file PDF/DOCX. AI tự trích xuất thông tin.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    num: "02",
    icon: "fa-solid fa-sliders",
    title: "Cấu Hình Tiêu Chí",
    desc: "Đặt trọng số và bộ lọc cứng phù hợp với yêu cầu tuyển dụng.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    num: "03",
    icon: "fa-solid fa-cloud-arrow-up",
    title: "Upload Hồ Sơ",
    desc: "Kéo thả hàng loạt CV (PDF, DOCX, ảnh). Hỗ trợ Google Drive.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    num: "04",
    icon: "fa-solid fa-chart-line",
    title: "Xem Kết Quả",
    desc: "Nhận bảng điểm chi tiết, xếp hạng và gợi ý phỏng vấn ngay.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
];

const comparisonRowsMobile = comparisonRows.slice(0, 5);

const ComparisonTable = ({ rows }: { rows: typeof comparisonRows }) => (
  <div className="min-w-[680px] rounded-2xl border border-white/5 overflow-hidden">
    <div className="grid grid-cols-[1.5fr_1fr_1fr] px-5 py-3 text-[10px] uppercase tracking-[0.35em] text-slate-600 bg-white/3 border-b border-white/5">
      <div>Tiêu chí</div>
      <div><p className="text-slate-300 text-xs normal-case font-semibold">ChatGPT</p><p className="text-[10px] text-slate-600 normal-case mt-0.5">AI tổng quát</p></div>
      <div><p className="text-emerald-400 text-xs normal-case font-semibold">Support HR</p><p className="text-[10px] text-slate-600 normal-case mt-0.5">AI chuyên biệt</p></div>
    </div>
    {rows.map((row) => (
      <div key={row.label} className={`grid grid-cols-[1.5fr_1fr_1fr] px-5 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors ${row.emphasis ? "bg-emerald-500/3" : ""}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 flex-shrink-0"><i className={row.icon} /></span>
          <p className="text-sm font-medium text-slate-200">{row.label}</p>
        </div>
        <div className="flex items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ${statusStyles[row.chatgpt.status].badgeClass}`}><i className={`${statusStyles[row.chatgpt.status].icon} text-base`} /></span>
            <span className={`leading-tight ${statusStyles[row.chatgpt.status].textClass}`}>{row.chatgpt.text}</span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ${statusStyles[row.support.status].badgeClass}`}><i className={`${statusStyles[row.support.status].icon} text-base`} /></span>
            <span className={`leading-tight ${statusStyles[row.support.status].textClass}`}>{row.support.text}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface HomePageProps {
  setActiveStep: (step: AppStep) => void;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
  completedSteps: AppStep[];
  userAvatar?: string | null;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  setActiveStep, isLoggedIn, onLoginRequest, completedSteps, userAvatar, userName, userEmail,
}) => {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const [cacheStats, setCacheStats] = useState({ size: 0, hitRate: 0, oldestEntry: 0, newestEntry: 0 });
  const [historyStats, setHistoryStats] = useState({ totalSessions: 0, lastSession: null as string | null, thisWeekCount: 0, thisMonthCount: 0 });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  const certificates = useMemo(() => ["/images/achive/Khuyến Khích Tin Học Trẻ.jpg", "/images/achive/sáng tạo thanh thiếu niên.jpg"], []);
  const [certIndex, setCertIndex] = useState(0);

  const refreshHistoryData = () => {
    setCacheStats(analysisCacheService.getCacheStats());
    setHistoryStats(cvFilterHistoryService.getHistoryStats());
    setRecentHistory(cvFilterHistoryService.getRecentHistory());
  };

  useEffect(() => {
    if (certificates.length > 1) {
      const interval = setInterval(() => setCertIndex((prev) => (prev + 1) % certificates.length), 5000);
      return () => clearInterval(interval);
    }
  }, [certificates]);

  useEffect(() => { refreshHistoryData(); }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsVideoOpen(false); setMobileMenuOpen(false); setActiveMegaMenu(null); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMegaMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleStart = () => { isLoggedIn ? setActiveStep("jd") : onLoginRequest(); };
  const nextStep = useMemo(() => flowOrder.find((step) => !completedSteps.includes(step)) || "analysis", [completedSteps]);
  const canContinue = completedSteps.length > 0;

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    setActiveMegaMenu(null);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClearCache = () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ cache?")) {
      analysisCacheService.clearCache();
      refreshHistoryData();
    }
  };

  const mobileNavItems = [
    { label: "Tính năng", icon: "fa-circle-info", target: "features" },
    { label: "Quy trình", icon: "fa-list-ol", target: "steps" },
    { label: "So sánh", icon: "fa-scale-balanced", target: "compare" },
    { label: "Bảng giá", icon: "fa-tags", target: "pricing" },
    { label: "Bảo mật", icon: "fa-user-shield", href: "/privacy-policy" },
    { label: "Điều khoản", icon: "fa-file-contract", href: "/terms" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-x-hidden">

      {/* ── Ambient Background Orbs ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full bg-blue-600/[0.03] blur-[140px]" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-600/[0.03] blur-[130px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── Mobile Overlay ───────────────────────────────────── */}
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setMobileMenuOpen(false)} />

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0B1120] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-out lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-8 h-8 rounded-lg object-cover" />
            <div><p className="text-sm font-bold text-white">SupportHR</p><p className="text-[10px] text-slate-500">AI Recruitment Platform</p></div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {mobileNavItems.map((item) => (
            <button key={item.label} onClick={() => item.href ? window.open(item.href, "_blank") : scrollTo(item.target!)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all text-left">
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid ${item.icon} text-[11px] text-slate-400`} />
              </div>
              <span className="text-[13px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800 space-y-2">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60 mb-1">
                <img src={userAvatar || "/images/logos/logo.jpg"} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                <div className="min-w-0"><p className="text-[12px] font-semibold text-white truncate">{userName || userEmail?.split("@")[0]}</p><p className="text-[10px] text-slate-500 truncate">{userEmail}</p></div>
              </div>
              <button onClick={() => { setMobileMenuOpen(false); setActiveStep("jd"); }}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-[13px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
                <i className="fa-solid fa-bolt text-xs" /> Bắt đầu ngay
              </button>
            </>
          ) : (
            <button onClick={() => { setMobileMenuOpen(false); onLoginRequest(); }}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-[13px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
              <i className="fa-solid fa-right-to-bracket text-[11px]" /> Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className="relative z-10">

        {/* ── Navbar ───────────────────────────────────────── */}
        <nav ref={navRef} className={`sticky top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "bg-[#0B1120]/90 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl shadow-black/20" : "bg-transparent"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo("hero")}>
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-white/10 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <img src="/images/logos/logo.jpg" alt="Support HR" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tight leading-none text-white">Support HR</span>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-0.5">AI Recruitment</span>
                </div>
              </div>

              {/* Desktop Nav Links */}
              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <a key={link.label} href={link.href}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200">
                    {link.label}
                  </a>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3">
                {!isLoggedIn && (
                  <button onClick={onLoginRequest}
                    className="hidden sm:flex h-9 px-5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all items-center gap-2">
                    <i className="fa-solid fa-right-to-bracket text-xs" /> Đăng nhập
                  </button>
                )}
                <button onClick={handleStart}
                  className="h-9 px-5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm transition-all items-center gap-2 shadow-lg shadow-cyan-500/20 flex">
                  <i className="fa-solid fa-bolt text-xs" /> Bắt đầu
                </button>
                <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden w-9 h-9 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
                  <i className="fa-solid fa-bars text-sm" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* ── Hero Section ──────────────────────────────────── */}
        <section id="hero" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Text Content */}
            <div className="flex flex-col gap-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">AI-Powered Recruitment Platform</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-black text-white leading-[1.05] tracking-tight">
                Sàng Lọc CV<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                  Nhanh Gấp 10 Lần.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-lg">
                Nền tảng AI chuyên biệt cho tuyển dụng. Phân tích <span className="text-slate-200 font-medium">hàng trăm CV</span> chỉ trong
                <span className="text-cyan-400 font-semibold"> 2 phút</span>, xếp hạng và gợi ý phỏng vấn tự động.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <button onClick={handleStart}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/35 transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-2.5">
                  <i className="fa-solid fa-rocket text-sm" /> Bắt đầu miễn phí
                </button>
                <button onClick={() => setIsVideoOpen(true)}
                  className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-semibold text-base hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2.5">
                  <i className="fa-regular fa-circle-play text-cyan-400 text-lg" /> Xem demo
                </button>
              </div>

              {/* Trust line */}
              <p className="text-xs text-slate-500 font-medium">
                <i className="fa-solid fa-shield-check text-emerald-400 mr-1" />
                Dùng thử 7 ngày · Không cần thẻ tín dụng · Hủy bất kỳ lúc nào
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-800/50">
                {[
                  { value: "100+", label: "CV / phiên", icon: "fa-files-o" },
                  { value: "< 2 phút", label: "Thời gian xử lý", icon: "fa-stopwatch" },
                  { value: "95%+", label: "Độ chính xác", icon: "fa-crosshairs" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <i className={`fa-solid ${stat.icon} text-cyan-400 text-[10px]`} />
                      <span className="text-xl font-black text-white tracking-tight">{stat.value}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual Card */}
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-cyan-600/20 via-blue-600/15 to-violet-600/20 blur-3xl opacity-60" />

              {/* Card */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-[#0B1120]/80 backdrop-blur-xl">
                {/* Card Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Support HR — Dashboard</span>
                  <div className="w-16" />
                </div>
                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Tổng CV", value: "247", color: "text-cyan-400" },
                      { label: "Đạt yêu cầu", value: "89", color: "text-emerald-400" },
                      { label: "Từ chối", value: "158", color: "text-rose-400" },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Mini candidate list */}
                  {[
                    { name: "Nguyễn Văn A", score: 96, title: "Senior Frontend Dev", color: "emerald" },
                    { name: "Trần Thị B", score: 89, title: "Fullstack Engineer", color: "cyan" },
                    { name: "Lê Văn C", score: 84, title: "Backend Developer", color: "blue" },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-800/30 rounded-xl px-4 py-3 border border-white/5 hover:border-white/10 transition-colors">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white ${c.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : c.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{c.title}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-base font-black ${c.color === 'emerald' ? 'text-emerald-400' : c.color === 'cyan' ? 'text-cyan-400' : 'text-blue-400'}`}>{c.score}%</p>
                        <p className="text-[10px] text-slate-500">match</p>
                      </div>
                    </div>
                  ))}
                  {/* Play button overlay */}
                  <button onClick={() => setIsVideoOpen(true)} className="w-full py-3 rounded-xl border border-dashed border-cyan-500/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2">
                    <i className="fa-regular fa-circle-play" /> Xem toàn bộ dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trusted By ──────────────────────────────────────── */}
        <section className="border-y border-slate-800/50 bg-[#0B1120]/50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[11px] font-bold text-slate-600 uppercase tracking-[0.3em] mb-8">
              Được tin dùng bởi doanh nghiệp & tổ chức
            </p>
            <div className="flex flex-wrap justify-center items-center gap-10 lg:gap-16 opacity-50">
              {partners.map((p) => (
                <div key={p.name} className="h-10 flex items-center">
                  <img src={p.logo} alt={p.name} className="h-full w-auto object-contain brightness-150" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Section ───────────────────────────────── */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 mb-4">
              <i className="fa-solid fa-sparkles text-indigo-400 text-[10px]" />
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Tính năng nổi bật</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Mọi thứ bạn cần để<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">tuyển dụng thông minh hơn</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Từ phân tích CV đến gợi ý phỏng vấn — Support HR cung cấp giải pháp toàn diện cho quy trình tuyển dụng hiện đại.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div key={i} className={`group relative rounded-2xl border ${feature.border} ${feature.bg} p-6 hover:${feature.border} hover:${feature.bg.replace('/10', '/15')} transition-all duration-300 hover:-translate-y-1 cursor-default`}>
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${feature.bg} border ${feature.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`fa-solid ${feature.icon} text-xl ${feature.iconColor}`} />
                </div>
                {/* Text */}
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                {/* Arrow */}
                <div className={`absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${feature.iconColor}`}>
                  <i className="fa-solid fa-arrow-right text-sm" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Steps Section ─────────────────────────────────── */}
        <section id="steps" className="bg-[#0B1120]/60 border-y border-slate-800/50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-4">
                <i className="fa-solid fa-route text-cyan-400 text-[10px]" />
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">Quy trình</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Chỉ 4 bước đơn giản
              </h2>
              <p className="mt-4 text-slate-400 max-w-lg mx-auto">
                Từ nhập JD đến kết quả phân tích — toàn bộ quy trình tự động hóa, nhanh chóng và chính xác.
              </p>
            </div>

            <div className="relative">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

              <div className="grid md:grid-cols-4 gap-8">
                {steps.map((step, i) => (
                  <div key={i} className="relative flex flex-col items-center text-center group">
                    {/* Step Number */}
                    <div className={`w-14 h-14 rounded-2xl ${step.bg} border ${step.border} flex items-center justify-center mb-5 relative z-10 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-black/20`}>
                      <i className={`fa-solid ${step.icon} text-xl ${step.color}`} />
                      <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-[#0B1120] border border-slate-700 text-[10px] font-black text-slate-400 flex items-center justify-center">{step.num}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-[200px]">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA after steps */}
            <div className="text-center mt-16">
              <button onClick={handleStart}
                className="h-12 px-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 transition-all hover:-translate-y-0.5 flex items-center gap-2 mx-auto">
                <i className="fa-solid fa-rocket text-sm" /> Thử ngay — Miễn phí 7 ngày
              </button>
            </div>
          </div>
        </section>

        {/* ── Why Us Section ────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-4">
                <i className="fa-solid fa-bolt text-emerald-400 text-[10px]" />
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Tại sao chọn Support HR</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-6">
                Thay thế quy trình thủ công bằng
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400"> AI thông minh</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Thay vì đọc từng CV trong hàng giờ, Support HR giúp bạn tìm được ứng viên phù hợp nhất chỉ trong vài phút với độ chính xác vượt trội.
              </p>

              {/* Comparison mini cards */}
              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-xmark text-sm text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Quy trình thủ công</p>
                    <p className="text-xs text-slate-500 mt-0.5">30-45 phút/CV · Dễ bỏ sót ứng viên tiềm năng</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-check text-sm text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Support HR AI</p>
                    <p className="text-xs text-slate-400 mt-0.5">100 CV trong 2 phút · Highlight kỹ năng tự động · Điểm số trực quan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "85%", label: "Thời gian tiết kiệm", icon: "fa-clock", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
                { value: "3X", label: "Tốc độ tuyển dụng", icon: "fa-bolt", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                { value: "99%", label: "Độ hài lòng", icon: "fa-heart", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                { value: "0đ", label: "Chi phí dùng thử", icon: "fa-tag", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-2xl border ${stat.border} ${stat.bg} p-6 hover:${stat.border} transition-all hover:-translate-y-0.5`}>
                  <i className={`fa-solid ${stat.icon} ${stat.color} text-lg mb-3`} />
                  <p className={`text-3xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Comparison Section ──────────────────────────────── */}
        <section id="compare" className="bg-[#0B1120]/60 border-y border-slate-800/50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 mb-4">
                <i className="fa-solid fa-code-compare text-violet-400 text-[10px]" />
                <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">So sánh</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Support HR vs ChatGPT
              </h2>
              <p className="mt-4 text-slate-400 max-w-lg mx-auto">
                So sánh chi tiết giữa AI tổng quát và nền tảng tuyển dụng chuyên biệt của Support HR.
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto"><ComparisonTable rows={comparisonRows} /></div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {comparisonRowsMobile.map((row) => (
                <div key={row.label} className={`rounded-xl border p-4 ${row.emphasis ? "border-emerald-500/10 bg-emerald-500/3" : "border-white/5 bg-white/3"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400"><i className={`${row.icon} text-sm`} /></span>
                    <p className="text-sm font-semibold text-slate-100">{row.label}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">ChatGPT</p>
                      <div className="flex items-start gap-2">
                        <i className={`${statusStyles[row.chatgpt.status].icon} mt-0.5 text-xs ${row.chatgpt.status === "negative" ? "text-rose-400" : "text-slate-500"}`} />
                        <span className="text-xs text-slate-400 leading-tight">{row.chatgpt.text}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-emerald-500/70 mb-1">Support HR</p>
                      <div className="flex items-start gap-2">
                        <i className={`${statusStyles[row.support.status].icon} mt-0.5 text-xs text-emerald-400`} />
                        <span className={`text-xs leading-tight ${row.support.status === "highlight" ? "text-white font-semibold" : "text-emerald-300/80"}`}>{row.support.text}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => scrollTo("compare")} className="w-full py-3 text-sm text-slate-400 hover:text-white transition-colors text-center">
                Xem thêm 7 tiêu chí khác ↓
              </button>
            </div>
          </div>
        </section>

        {/* ── Pricing / CTA Section ───────────────────────────── */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="relative rounded-3xl overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-cyan-950/60 via-[#0B1120] to-indigo-950/40">
            {/* Glow */}
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px]" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px]" />

            <div className="relative z-10 text-center py-16 px-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-6">
                <i className="fa-solid fa-rocket text-cyan-400 text-[10px]" />
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">Bắt đầu ngay hôm nay</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                Sẵn sàng tuyển dụng thông minh hơn?
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto mb-10">
                Tham gia cùng hàng nghìn chuyên gia HR đã tin tưởng Support HR để tìm kiếm nhân tài.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={handleStart}
                  className="h-12 px-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/35 transition-all hover:-translate-y-0.5 flex items-center gap-2.5">
                  <i className="fa-solid fa-rocket text-sm" /> Dùng thử miễn phí
                </button>
                <button onClick={onLoginRequest}
                  className="h-12 px-8 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-white/10 transition-all flex items-center gap-2.5">
                  <i className="fa-solid fa-calendar text-sm" /> Đặt lịch demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact Section ────────────────────────────────── */}
        <section id="contact" className="border-t border-slate-800/50 bg-[#0B1120]/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-4 gap-10">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-9 h-9 rounded-lg object-cover" />
                  <div>
                    <p className="text-base font-bold text-white">Support HR</p>
                    <p className="text-[10px] text-cyan-400 uppercase tracking-widest">AI Recruitment Platform</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-4">
                  Nền tảng tuyển dụng thông minh hàng đầu Việt Nam. Sử dụng AI để tìm kiếm, sàng lọc và đánh giá ứng viên nhanh chóng, chính xác.
                </p>
                <div className="flex items-center gap-3 text-slate-400">
                  <a href="tel:0899280108" className="text-sm hover:text-cyan-400 transition-colors">
                    <i className="fa-solid fa-phone text-xs mr-1" /> 0899 280 108
                  </a>
                  <span className="text-slate-600">·</span>
                  <a href="mailto:support@supporthr.vn" className="text-sm hover:text-cyan-400 transition-colors">
                    <i className="fa-solid fa-envelope text-xs mr-1" /> support@supporthr.vn
                  </a>
                </div>
              </div>

              {/* Links */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Sản phẩm</h4>
                <div className="space-y-2.5">
                  {["Tính năng", "Bảng giá", "Quy trình", "So sánh", "API Docs"].map((l) => (
                    <button key={l} onClick={() => scrollTo(l === "Tính năng" ? "features" : l === "Quy trình" ? "steps" : l === "So sánh" ? "compare" : "#")}
                      className="block text-sm text-slate-400 hover:text-white transition-colors text-left">{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Công ty</h4>
                <div className="space-y-2.5">
                  {[
                    { label: "Giới thiệu", href: "#hero" },
                    { label: "Bảo mật", href: "/privacy-policy" },
                    { label: "Điều khoản", href: "/terms" },
                    { label: "Liên hệ", href: "mailto:support@supporthr.vn" },
                  ].map((l) => (
                    <a key={l.label} href={l.href}
                      className="block text-sm text-slate-400 hover:text-white transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/50 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                © 2026 SupportHR. Mọi quyền được bảo lưu.
              </p>
              <div className="flex items-center gap-4 text-slate-500">
                <a href="https://github.com/phucdevweb" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white transition-colors">
                  <i className="fa-brands fa-github text-base" />
                </a>
                <a href="#" className="text-xs hover:text-white transition-colors">
                  <i className="fa-brands fa-facebook text-base" />
                </a>
                <a href="#" className="text-xs hover:text-white transition-colors">
                  <i className="fa-brands fa-linkedin text-base" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Video Modal ──────────────────────────────────────── */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setIsVideoOpen(false)}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" style={{ animation: "fadeIn .2s ease" }} />
          <div className="relative z-10 w-full max-w-4xl rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
            style={{ animation: "scaleIn .25s ease" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900/95 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-circle-play text-blue-400" />
                <span className="text-white font-semibold text-sm">Video Demo – Support HR</span>
              </div>
              <button onClick={() => setIsVideoOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <div className="bg-black aspect-video">
              <video src="/images/video/SPHR Ver3.mp4" poster="/images/video/cover.png" controls autoPlay className="w-full h-full object-contain" />
            </div>
          </div>
          <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } } @keyframes scaleIn { from { opacity:0; transform:scale(.92) } to { opacity:1; transform:scale(1) } }`}</style>
        </div>
      )}

      <ChatBubble />
    </div>
  );
};

export default HomePage;
