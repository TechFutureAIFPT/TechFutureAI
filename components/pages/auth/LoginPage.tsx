import React, { useState, useEffect, useRef, useCallback } from 'react';
import { signInWithGoogle, signUpWithEmail, signInWithEmail, sendResetPassword, mapFirebaseError } from '../../../services/auth/authService';
import type { AuthUser } from '../../../services/auth/authTypes';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

type AuthTab = 'signin' | 'signup';

interface FormState {
  email: string;
  password: string;
  displayName: string;
}

const features = [
  {
    icon: 'fa-solid fa-brain',
    title: 'AI Phân tích Thông minh',
    desc: 'Đánh giá ứng viên tự động bằng Gemini GPT với độ chính xác 95%.',
  },
  {
    icon: 'fa-solid fa-bolt',
    title: 'Tuyển Dụng Nhanh 10x',
    desc: 'Giảm 80% thời gian sàng lọc — từ ngày sang vài phút.',
  },
  {
    icon: 'fa-solid fa-chart-line',
    title: 'Dữ Liệu Chi Tiết',
    desc: 'Dashboard trực quan, so sánh điểm mạnh/yếu từng ứng viên.',
  },
];

const stats = [
  { value: '10,000+', label: 'CV đã phân tích' },
  { value: '500+', label: 'Doanh nghiệp tin dùng' },
  { value: '95%', label: 'Độ chính xác AI' },
];

const DEMO_VIDEO_ID = 'SRrdNEkmeBU';
const DEMO_VIDEO_EMBED = `https://www.youtube.com/embed/${DEMO_VIDEO_ID}?rel=0&modestbranding=1`;

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Vui lòng nhập email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ.';
  return null;
}

function validatePassword(password: string, minLen = 6): string | null {
  if (!password) return 'Vui lòng nhập mật khẩu.';
  if (password.length < minLen) return `Mật khẩu phải có ít nhất ${minLen} ký tự.`;
  return null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [tab, setTab] = useState<AuthTab>('signin');
  const [form, setForm] = useState<FormState>({ email: '', password: '', displayName: '' });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successStage, setSuccessStage] = useState<'idle' | 'celebrating' | 'transitioning'>('idle');
  const [loaded, setLoaded] = useState(false);
  const [demoVideoOpen, setDemoVideoOpen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 6,
      duration: Math.random() * 4 + 3,
      color: ['bg-cyan-400/30', 'bg-violet-400/25', 'bg-blue-400/20'][Math.floor(Math.random() * 3)],
    })),
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const setField = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setAuthError('');
  }, []);

  useEffect(() => { setLoaded(true); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let t = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      for (let i = 0; i < 6; i++) {
        const x = w * 0.5 + Math.cos(t * 0.3 + i * 1.05) * w * 0.35;
        const y = h * 0.5 + Math.sin(t * 0.4 + i * 1.05) * h * 0.35;
        const r = 120 + i * 30;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, `hsla(${180 + i * 25}, 80%, 55%, 0.07)`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 8; i++) {
        const angle = t * 0.15 + (i / 8) * Math.PI * 2;
        const r = Math.min(w, h) * 0.22;
        const x = w * 0.5 + Math.cos(angle) * r;
        const y = h * 0.5 + Math.sin(angle) * r;
        const dotR = 2 + Math.sin(t + i) * 1;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, dotR * 3);
        grd.addColorStop(0, `hsla(${200 + i * 20}, 90%, 65%, 0.6)`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, dotR * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      t += 0.008;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  useEffect(() => {
    if (!demoVideoOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDemoVideoOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [demoVideoOpen]);

  useEffect(() => {
    if (!demoVideoOpen) { setIframeLoaded(false); setIframeFailed(false); }
  }, [demoVideoOpen]);

  const runSuccessAnimation = (user: AuthUser) => {
    setShowSuccess(true);
    setSuccessStage('celebrating');
    setTimeout(() => {
      setSuccessStage('transitioning');
      setTimeout(() => onLogin(user), 900);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showReset) {
      const emailErr = validateEmail(resetEmail);
      if (emailErr) { setErrors({ email: emailErr }); return; }
      setLoading(true);
      setAuthError('');
      try {
        await sendResetPassword(resetEmail);
        setResetSent(true);
      } catch (err: any) {
        setAuthError(mapFirebaseError(err.code));
      } finally {
        setLoading(false);
      }
      return;
    }

    const emailErr = validateEmail(form.email);
    const pwErr = validatePassword(form.password);
    if (emailErr || pwErr) { setErrors({ email: emailErr || undefined, password: pwErr || undefined }); return; }
    if (tab === 'signup') {
      const nameErr = !form.displayName.trim() ? 'Vui lòng nhập họ tên.' : null;
      if (nameErr) { setErrors({ displayName: nameErr }); return; }
    }
    setLoading(true);
    setAuthError('');
    try {
      const user = tab === 'signup'
        ? await signUpWithEmail({ email: form.email, password: form.password, displayName: form.displayName })
        : await signInWithEmail({ email: form.email, password: form.password });
      runSuccessAnimation(user);
    } catch (err: any) {
      setAuthError(mapFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError('');
    try {
      const user = await signInWithGoogle();
      runSuccessAnimation(user);
    } catch (err: any) {
      setAuthError(mapFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex transition-all duration-1000 ease-out ${
        successStage === 'transitioning' ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: '#06091a' }}
    >
      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div
        className={`hidden lg:flex flex-col justify-between w-[46%] relative overflow-hidden shrink-0 transition-all duration-1200 ease-out ${
          loaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
        }`}
        style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0d1f3c 50%, #091525 100%)' }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {particles.map(p => (
          <div
            key={p.id}
            className={`absolute rounded-full animate-pulse ${p.color}`}
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, opacity: 0.5,
            }}
          />
        ))}

        <div className="relative z-10 p-6 lg:p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/15 border border-slate-700/50">
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base tracking-tight">SupportHR</h2>
            <p className="text-slate-500 text-[11px]">AI Recruitment Intelligence</p>
          </div>
        </div>

        <div className="relative z-10 px-8 lg:px-10 py-4">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-white leading-tight mb-3 tracking-tight">
              Tuyển dụng thông minh.<br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Quyết định chính xác.
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Nền tảng AI phân tích CV tự động, giúp đội ngũ tuyển dụng sàng lọc ứng viên nhanh hơn 10 lần với độ chính xác cao nhất.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-black text-white mb-0.5">{s.value}</div>
                <div className="text-slate-500 text-[10px] leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {features.map(f => (
              <div key={f.title} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <i className={`${f.icon} text-cyan-400 text-[10px]`} />
                </div>
                <div>
                  <div className="text-white text-xs font-semibold mb-0.5">{f.title}</div>
                  <div className="text-slate-500 text-[11px] leading-snug">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-8 pb-6 lg:pb-8">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">NT</div>
            <div>
              <p className="text-slate-300 text-[11px] italic leading-relaxed">
                "SupportHR giúp tôi giảm 70% thời gian sàng lọc. Đội ngũ HR của tôi giờ tập trung vào phỏng vấn thay vì đọc hàng trăm CV."
              </p>
              <p className="text-slate-600 text-[10px] mt-1">Nguyễn Thu Hà — HR Manager, FPT Software</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-8 pb-6">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-2 pl-0.5">Video demo</p>
          <button
            type="button"
            onClick={() => setDemoVideoOpen(true)}
            className="group w-full text-left flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all duration-200"
          >
            <div className="w-14 h-10 rounded-lg shrink-0 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0f2a3d 0%, #0a1e30 40%, #0d2e45 70%, #061224 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                  <svg width="8" height="10" viewBox="0 0 8 10" fill="white"><path d="M0 0L8 5L0 10V0Z" /></svg>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-slate-300 text-xs font-medium leading-snug truncate pr-2">Xem video giới thiệu SupportHR</p>
              <p className="text-slate-600 text-[10px] mt-0.5">Phát trong trang · YouTube</p>
            </div>
            <i className="fa-solid fa-circle-play text-cyan-500/70 text-sm shrink-0 ml-auto pr-1 group-hover:text-cyan-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col items-center justify-center px-5 py-8 lg:py-10 transition-all duration-1200 ease-out ${
        loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-xl border border-slate-700/50">
              <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">SupportHR</h2>
              <p className="text-slate-500 text-xs">AI Recruitment Intelligence</p>
            </div>
          </div>

          {/* Card */}
          <div
            className={`bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl transition-all duration-700 ${
              successStage === 'celebrating' ? 'border-emerald-400/30 shadow-emerald-500/10' : ''
            }`}
          >
            {/* Success banner */}
            {showSuccess && (
              <div className={`mb-6 p-4 rounded-2xl border backdrop-blur-sm transition-all duration-700 ${
                successStage === 'celebrating'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-400/40 scale-100 opacity-100'
                  : 'scale-95 opacity-0'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center ${successStage === 'celebrating' ? 'animate-bounce' : ''}`}>
                    <i className="fa-solid fa-check text-emerald-400 text-sm" />
                  </div>
                  <span className="text-emerald-200 text-sm font-semibold">
                    {tab === 'signup' ? 'Đăng ký thành công!' : 'Đăng nhập thành công!'}
                  </span>
                </div>
              </div>
            )}

            {/* Auth error */}
            {authError && (
              <div className="mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-triangle-exclamation text-red-400 text-sm" />
                  </div>
                  <span className="text-red-300 text-sm">{authError}</span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {(['signin', 'signup'] as AuthTab[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setErrors({}); setAuthError(''); setForm({ email: '', password: '', displayName: '' }); setResetSent(false); setResetEmail(''); setShowReset(false); }}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                    tab === t
                      ? 'bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t === 'signin' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>

            {/* Form */}
            {showReset ? (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                      errors.email ? 'border border-red-500/50 bg-red-500/5' : 'border border-slate-700/60 bg-slate-800/40 focus:border-indigo-500/50'
                    }`}
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />
                  {errors.email && <p className="text-red-400 text-[10px] mt-1">{errors.email}</p>}
                </div>

                <div className="p-3 rounded-xl text-[12px] text-slate-400 leading-relaxed" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu vào hộp thư của bạn.
                </div>

                {resetSent && (
                  <div className="p-3 rounded-xl text-[12px] text-emerald-300 leading-relaxed" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <i className="fa-solid fa-envelope-circle-check mr-1.5" />
                    Đã gửi! Kiểm tra hộp thư <strong>{resetEmail}</strong> và làm theo hướng dẫn trong email.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
                >
                  {loading ? 'Đang xử lý...' : 'Gửi liên kết'}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(''); setErrors({}); setAuthError(''); }}
                  className="w-full py-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ← Quay lại đăng nhập
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {tab === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Họ tên</label>
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={e => setField('displayName', e.target.value)}
                      placeholder="Nhập họ tên của bạn"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                        errors.displayName ? 'border border-red-500/50 bg-red-500/5' : 'border border-slate-700/60 bg-slate-800/40 focus:border-indigo-500/50'
                      }`}
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                    {errors.displayName && <p className="text-red-400 text-[10px] mt-1">{errors.displayName}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                      errors.email ? 'border border-red-500/50 bg-red-500/5' : 'border border-slate-700/60 bg-slate-800/40 focus:border-indigo-500/50'
                    }`}
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />
                  {errors.email && <p className="text-red-400 text-[10px] mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Mật khẩu</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    placeholder={tab === 'signup' ? 'Ít nhất 6 ký tự' : 'Nhập mật khẩu'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                      errors.password ? 'border border-red-500/50 bg-red-500/5' : 'border border-slate-700/60 bg-slate-800/40 focus:border-indigo-500/50'
                    }`}
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />
                  {errors.password && <p className="text-red-400 text-[10px] mt-1">{errors.password}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
                >
                  {loading ? 'Đang xử lý...' : tab === 'signup' ? 'Tạo tài khoản' : 'Đăng nhập'}
                </button>

                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="w-full py-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors text-center"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">hoặc</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl
                bg-white text-slate-800 font-semibold text-sm
                hover:bg-slate-100 active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-[#06091a]
                transition-all duration-200 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1818182,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
              </svg>
              Tiếp tục với Google
            </button>
          </div>

          {/* Footer links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-700">
            <button type="button" onClick={() => setDemoVideoOpen(true)} className="lg:hidden text-cyan-600 hover:text-cyan-400 transition-colors">Video demo</button>
            <span className="lg:hidden text-slate-800">·</span>
            <a href="/terms" className="hover:text-slate-400 transition-colors">Điều khoản</a>
            <span>·</span>
            <a href="/privacy-policy" className="hover:text-slate-400 transition-colors">Bảo mật</a>
            <span>·</span>
            <a href="mailto:support@supporthr.io" className="hover:text-slate-400 transition-colors">Liên hệ</a>
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-800 uppercase tracking-widest font-semibold">
            © 2026 SupportHR · AI Recruitment Intelligence Platform
          </p>
        </div>
      </div>

      {/* Video demo modal */}
      {demoVideoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDemoVideoOpen(false)} />
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0b1220] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#0f1729]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/35 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-play text-cyan-400 text-[10px] ml-0.5" />
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-white truncate">Video Demo – SupportHR</h2>
              </div>
              <button type="button" onClick={() => setDemoVideoOpen(false)} className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <div className="aspect-video bg-black relative overflow-hidden">
              {iframeFailed ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0d1629]">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <i className="fa-solid fa-video text-cyan-400 text-2xl" />
                  </div>
                  <div className="text-center px-6">
                    <p className="text-white font-semibold text-sm mb-1">Không thể tải video trong trang</p>
                    <p className="text-slate-400 text-xs mb-4">Có thể YouTube bị chặn trong mạng của bạn</p>
                    <a href={`https://youtu.be/${DEMO_VIDEO_ID}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium hover:bg-cyan-500/30 transition-colors">
                      <i className="fa-brands fa-youtube text-sm" />
                      Xem trên YouTube
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                        <span className="text-slate-500 text-xs">Đang tải video…</span>
                      </div>
                    </div>
                  )}
                  <iframe
                    title="Video demo SupportHR"
                    src={DEMO_VIDEO_EMBED}
                    className="w-full h-full"
                    onLoad={() => setIframeLoaded(true)}
                    onError={() => setIframeFailed(true)}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-4 py-2.5 border-t border-white/[0.06] bg-[#0f1729]/80">
              <a href={`https://youtu.be/${DEMO_VIDEO_ID}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors">
                Mở trên YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
