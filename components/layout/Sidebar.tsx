/**
 * Sidebar — Professional HR Platform (Dark Theme)
 * Dong bo mau voi DarkSection (#0B1120 / #0f172a)
 * Màu sắc đồng bộ từ tokens.ts
 */
import React, { useState } from 'react';
import {
  Briefcase, SlidersHorizontal, Upload, Sparkles,
  PieChart, MessageSquare, LogOut, ChevronDown, UserCheck,
} from 'lucide-react';
import type { AppStep } from '../../assets/types';

interface SidebarProps {
  activeStep: AppStep;
  setActiveStep: (step: AppStep) => void;
  completedSteps: AppStep[];
  onReset: () => void;
  onLogout?: () => void;
  userEmail?: string;
  userAvatar?: string | null;
  userName?: string;
  onLoginRequest?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onShowSettings?: () => void;
  onShowHistory?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNewSession?: () => void;
}

// ── Dark palette (đồng bộ với tokens.ts) ───────────────────────────────
const C = {
  bg:         '#0B1120',   // tokens.dark.bgPrimary — nền chính sidebar
  bg2:        '#0f172a',   // tokens.dark.bgSecondary — section header
  bg3:        '#1e293b',   // tokens.dark.bgTertiary — hover bg
  bg4:        '#111827',   // tokens.dark.gradientCard darker
  border:     '#1e293b',   // tokens.dark.bgTertiary
  border2:    '#334155',   // slate-700
  text:       '#e2e8f0',   // tokens.dark.textSecondary
  text2:      '#94a3b8',   // tokens.dark.textMuted
  text3:      '#475569',   // slate-600
  accentBlue: '#60a5fa',   // tokens.dark.primary — light blue
  accent:     '#818cf8',   // tokens.dark.accent — indigo brand
  // Gradient cho header sidebar
  headerGradient: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
} as const;

// ── Step definitions ───────────────────────────────────────────────────────
const PROCESS_STEPS: Array<{
  key: AppStep; label: string; sub: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string; bgActive: string;
}> = [
  { key: 'jd',       label: 'Mô tả công việc', sub: 'Nhập JD · Bước 1',
    icon: Briefcase,         color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },   // tokens.dark.primary
  { key: 'weights',  label: 'Trọng số & Bộ lọc', sub: 'Thiết lập · Bước 2',
    icon: SlidersHorizontal, color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },   // tokens.dark.primary (đồng bộ)
  { key: 'upload',   label: 'Tải lên CV', sub: 'Upload · Bước 3',
    icon: Upload,            color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },   // tokens.dark.primary (đồng bộ)
  { key: 'analysis', label: 'Phân tích AI', sub: 'Xử lý · Bước 4',
    icon: Sparkles,          color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },   // tokens.dark.primary (đồng bộ)
];

const TOOL_ITEMS: Array<{
  key: AppStep; label: string; sub: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string; bgActive: string;
}> = [
  { key: 'dashboard', label: 'Thống kê chi tiết', sub: 'Analytics Dashboard',
    icon: PieChart,      color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },   // tokens.dark.primary
  { key: 'chatbot',    label: 'Gợi ý ứng viên AI',  sub: 'AI Recruitment Assistant',
    icon: MessageSquare, color: '#60a5fa', bgActive: 'rgba(96,165,250,0.1)' },   // tokens.dark.primary
  { key: 'selected',   label: 'Ứng viên đã chọn', sub: 'Shortlist candidates',
    icon: UserCheck,     color: '#34d399', bgActive: 'rgba(52,211,153,0.1)' },   // emerald — shortlist
];

// ── Helpers ────────────────────────────────────────────────────────────────
const isStepEnabled = (step: AppStep, completedSteps: AppStep[]): boolean => {
  if (step === 'jd') return true;
  if (step === 'weights') return completedSteps.includes('jd');
  if (step === 'upload') return completedSteps.includes('jd') && completedSteps.includes('weights');
  if (step === 'analysis') return completedSteps.includes('jd') && completedSteps.includes('weights') && completedSteps.includes('upload');
  if (step === 'dashboard' || step === 'chatbot' || step === 'selected') return completedSteps.includes('upload');
  return false;
};

// ── Sub-components ─────────────────────────────────────────────────────────
const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2.5 px-3 pt-4 pb-1.5">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-800/60" />
    <span className="text-[9px] font-bold uppercase tracking-[0.14em] whitespace-nowrap" style={{ color: C.text3 }}>
      {label}
    </span>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-800/60" />
  </div>
);

const NavItem = ({
  item, activeStep, completedSteps, onClick,
}: {
  item: (typeof PROCESS_STEPS)[number] | (typeof TOOL_ITEMS)[number];
  activeStep: AppStep;
  completedSteps: AppStep[];
  onClick: () => void;
}) => {
  const isActive  = activeStep === item.key;
  const isDone    = completedSteps.includes(item.key);
  const isEnabled = isStepEnabled(item.key, completedSteps);
  const Icon      = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isEnabled}
      className={`
        relative w-full flex items-center gap-3 px-3 py-2.5  transition-all duration-200 text-left
        ${isActive
          ? ''
          : isEnabled
            ? 'hover:bg-white/5'
            : 'opacity-35 cursor-not-allowed'
        }
      `}
    >
      {/* Active background card */}
      {isActive && (
        <div
          className="absolute inset-0 "
          style={{
            background: item.bgActive,
            border: `1px solid ${item.color}25`,
            boxShadow: `0 0 16px ${item.color}12`,
          }}
        />
      )}

      {/* Left accent bar */}
      {isActive && (
        <div
          className="absolute left-0 top-2.5 bottom-2.5 w-[3px] "
          style={{ background: `linear-gradient(180deg, ${item.color}, ${item.color}60)` }}
        />
      )}

      {/* Icon */}
      <div
        className="relative flex h-9 w-9 shrink-0 items-center justify-center  transition-all duration-200"
        style={{
          background: isActive ? `${item.color}15` : 'rgba(255,255,255,0.04)',
          border: isActive ? `1px solid ${item.color}30` : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ color: isActive ? item.color : isEnabled ? C.text2 : C.text3 }}>
          <Icon size={17} />
        </span>
      </div>

      {/* Label */}
      <div className="relative min-w-0 flex-1">
        <p className="text-[12px] font-semibold leading-tight" style={{
          color: isActive ? C.text : isEnabled ? C.text2 : C.text3,
        }}>
          {item.label}
        </p>
        <p className="text-[10px] leading-tight mt-0.5" style={{ color: isActive ? item.color : C.text3 }}>
          {item.sub}
        </p>
      </div>

      {/* Done checkmark */}
      {isDone && !isActive && (
        <div
          className="relative flex h-5 w-5 shrink-0 items-center justify-center "
          style={{ background: `${item.color}15` }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3 5.5L6.5 2" stroke={item.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {isActive && (
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center " style={{ background: `${item.color}20` }}>
          <div className="h-1.5 w-1.5 " style={{ background: item.color }} />
        </div>
      )}
    </button>
  );
};

const StepProgress = ({ completedSteps }: { completedSteps: AppStep[] }) => {
  const total = PROCESS_STEPS.length;
  const done  = PROCESS_STEPS.filter(s => completedSteps.includes(s.key)).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold" style={{ color: C.text3 }}>Tiến độ</span>
        <span className="text-[10px] font-bold" style={{ color: pct === 100 ? '#34d399' : C.accentBlue }}>
          {pct === 100 ? 'Hoàn tất!' : `${done}/${total} bước`}
        </span>
      </div>
        <div className="h-1 w-full overflow-hidden " style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full  transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? 'linear-gradient(90deg, #10b981, #34d399)'  // tokens.dark.success → emerald
              : 'linear-gradient(90deg, #3B82F6, #60a5fa)', // tokens.dark.gradientPrimary
          }}
        />
      </div>
    </div>
  );
};

// ── Account Panel ──────────────────────────────────────────────────────────
const AccountPanel: React.FC<{
  completedSteps: AppStep[];
  userEmail?: string;
  userAvatar?: string | null;
  userName?: string;
  onLogout?: () => void;
  onLoginRequest?: () => void;
  onShowSettings?: () => void;
  onShowHistory?: () => void;
}> = ({ completedSteps, userEmail, userAvatar: avatar, userName: name, onLogout, onLoginRequest, onShowSettings, onShowHistory }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [localName, setLocalName]     = useState<string>('');

  const effectiveAvatar = (avatar !== undefined && avatar !== null) ? avatar : localAvatar;
  const effectiveName   = (name !== undefined && name !== '') ? name : localName;
  const analysisDone    = completedSteps.includes('analysis');

  React.useEffect(() => {
    // Load từ Firebase nếu: có email, và avatar chưa được cung cấp (undefined hoặc null) HOẶC name chưa có
    const needsAvatarLoad = avatar === undefined || avatar === null;
    const needsNameLoad   = name === undefined || name === '';
    if (!userEmail || (!needsAvatarLoad && !needsNameLoad)) return;
    (async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth');
        const { auth }               = await import('../../services/firebase');
        const { UserProfileService }  = await import('../../services/data-sync/userProfileService');
        const unsub = onAuthStateChanged(auth, async (user) => {
          if (user && user.email === userEmail) {
            if (needsNameLoad) {
              setLocalName(user.displayName || userEmail.split('@')[0]);
            }
            if (needsAvatarLoad) {
              // Ưu tiên: Firebase photoURL → Firestore avatar → localStorage cache
              if (user.photoURL) {
                setLocalAvatar(user.photoURL);
              } else {
                const profile = await UserProfileService.getUserProfile(user.uid);
                if (profile?.avatar) {
                  setLocalAvatar(profile.avatar);
                } else {
                  // fallback localStorage (lưu bởi Navbar với key avatar_${email})
                  const cached = localStorage.getItem(`avatar_${userEmail}`);
                  if (cached) setLocalAvatar(cached);
                }
              }
            }
          }
        });
        return () => unsub();
      } catch { /* ignore */ }
    })();
  }, [userEmail, avatar, name]);

  const getInitials = (n: string) => {
    const p = n.trim().split(' ');
    return p.length >= 2
      ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
      : n.charAt(0).toUpperCase();
  };

  const getAvatarGradient = (email: string) => {
    const grads = [
      'from-blue-600 to-indigo-700', 'from-blue-700 to-indigo-800',
      'from-blue-500 to-indigo-600', 'from-blue-800 to-indigo-900',
      'from-indigo-600 to-blue-700',
    ];
    return grads[email.charCodeAt(0) % grads.length];
  };

  if (!userEmail) {
    return onLoginRequest ? (
      <div className=" border p-3" style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}>
        <StepProgress completedSteps={completedSteps} />
        <button
          type="button"
          onClick={onLoginRequest}
          className="w-full flex items-center justify-center gap-2  py-2.5 text-[12px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}
        >
          <i className="fa-solid fa-right-to-bracket text-[11px]" />
          Đăng nhập ngay
        </button>
      </div>
    ) : null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="w-full flex items-center gap-2.5  px-3 py-2.5 text-left transition-all hover:brightness-110 active:scale-[0.995]"
        style={{
          background: showMenu ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${showMenu ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden  border border-white/10">
          {effectiveAvatar ? (
            <img src={effectiveAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getAvatarGradient(userEmail)} text-white text-xs font-black`}>
              {getInitials(effectiveName || userEmail)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold leading-tight" style={{ color: C.text }}>
            {effectiveName || userEmail.split('@')[0]}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5  bg-blue-400" />
              <span className="text-[9px] font-medium" style={{ color: C.text3 }}>Online</span>
            </span>
            {analysisDone && (
              <span
                className=" px-1.5 py-px text-[8px] font-bold"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
              >
                HR Pro
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          size={14}
          className="shrink-0 transition-transform duration-200"
          style={{ color: C.text3, transform: showMenu ? 'rotate(180deg)' : undefined }}
        />
      </button>

      {/* Dropdown */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div
            className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden  shadow-2xl"
            style={{
              background: C.bg4,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="flex items-center gap-3 border-b px-4 py-3"
              style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden  border border-white/10">
                {effectiveAvatar ? (
                  <img src={effectiveAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getAvatarGradient(userEmail)} text-sm font-black text-white`}>
                    {getInitials(effectiveName || userEmail)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold" style={{ color: C.text }}>{effectiveName || userEmail.split('@')[0]}</p>
                <p className="truncate text-[11px]" style={{ color: C.text2 }}>{userEmail}</p>
              </div>
            </div>

            <div className="p-1.5">
              {onShowSettings && (
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); onShowSettings(); }}
                  className="flex w-full items-center gap-2.5  px-3 py-2.5 text-left text-[12px] transition-colors hover:bg-white/5"
                  style={{ color: C.text2 }}
                >
                  <i className="fa-solid fa-file-invoice w-4 text-center text-[11px]" style={{ color: '#60a5fa' }} />
                  Mau JD da luu
                </button>
              )}
              {onShowHistory && (
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); onShowHistory(); }}
                  className="flex w-full items-center gap-2.5  px-3 py-2.5 text-left text-[12px] transition-colors hover:bg-white/5"
                  style={{ color: C.text2 }}
                >
                  <i className="fa-solid fa-clock-rotate-left w-4 text-center text-[11px]" style={{ color: '#3b82f6' }} />
                  Lich su sang loc
                </button>
              )}
              <div className="my-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <button
                type="button"
                onClick={() => { setShowMenu(false); onLogout?.(); }}
                className="flex w-full items-center gap-2.5  px-3 py-2.5 text-left text-[12px] transition-colors hover:bg-white/5"
                style={{ color: '#f87171' }}
              >
                <LogOut size={14} className="shrink-0" />
                Dang xuat
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Main Sidebar ────────────────────────────────────────────────────────────
const Sidebar: React.FC<SidebarProps> = ({
  activeStep, setActiveStep, completedSteps, onReset, onLogout,
  userEmail, userAvatar: externalAvatar, userName: externalUserName,
  onLoginRequest, isOpen = true, onClose, onShowSettings, onShowHistory,
}) => {
  const handleClick = (step: AppStep) => {
    if (isStepEnabled(step, completedSteps)) setActiveStep(step);
    if (window.innerWidth < 768 && onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay — chỉ khi drawer có onClose (đóng bằng tap nền). Luôn isOpen=true mà không onClose thì không phủ để không chặn main. */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        id="cv-sidebar"
        className={`
          fixed top-0 left-0 z-50 flex h-screen w-[248px] flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={{
          background: C.bg,
          borderRight: `1px solid ${C.border}`,
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div
          className="flex shrink-0 items-center gap-2.5 px-3 py-3"
          style={{
            background: C.headerGradient,  // tokens: linear-gradient(135deg, #1e3a5f, #1e40af)
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <button
            onClick={() => handleClick('jd')}
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden  border border-white/20 bg-black/30 shadow-sm transition-transform hover:scale-105"
          >
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="h-full w-full object-cover" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-white leading-none">SupportHR</h1>
              <span
                className=" px-1.5 py-px text-[8px] font-black uppercase tracking-wide"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#bae6fd' }}
              >
                AI
              </span>
            </div>
            <p className="mt-0.5 text-[9px] font-medium leading-none" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Recruitment Intelligence
            </p>
          </div>
        </div>

        {/* ── Nav ────────────────────────────────────────────── */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-2 px-2 custom-scrollbar">
          <SectionLabel label="Quy trình phân tích" />
          <div className="space-y-0.5">
            {PROCESS_STEPS.map(item => (
              <NavItem
                key={item.key}
                item={item}
                activeStep={activeStep}
                completedSteps={completedSteps}
                onClick={() => handleClick(item.key)}
              />
            ))}
          </div>

          <SectionLabel label="Công cụ hỗ trợ" />
          <div className="space-y-0.5">
            {TOOL_ITEMS.map(item => (
              <NavItem
                key={item.key}
                item={item}
                activeStep={activeStep}
                completedSteps={completedSteps}
                onClick={() => handleClick(item.key)}
              />
            ))}
          </div>
        </nav>

        {/* ── Account ─────────────────────────────────────────── */}
        <div className="shrink-0 border-t" style={{ borderColor: C.border }}>
          <AccountPanel
            completedSteps={completedSteps}
            userEmail={userEmail}
            userAvatar={externalAvatar}
            userName={externalUserName}
            onLogout={onLogout}
            onLoginRequest={onLoginRequest}
            onShowSettings={onShowSettings}
            onShowHistory={onShowHistory}
          />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
