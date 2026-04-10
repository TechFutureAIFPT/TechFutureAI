import React, { useMemo, useState } from "react";

type ChatBubbleAction =
  | { label: string; icon: string; href: string }
  | { label: string; icon: string; onClick: () => void };

const ChatBubble: React.FC = () => {
  const [open, setOpen] = useState(false);

  const actions = useMemo<ChatBubbleAction[]>(
    () => [
      {
        label: "Liên hệ qua Email",
        icon: "fa-regular fa-envelope",
        href: "mailto:support@example.com?subject=SupportHR%20-%20H%E1%BB%97%20tr%E1%BB%A3",
      },
      {
        label: "Chính sách bảo mật",
        icon: "fa-solid fa-user-shield",
        href: "/privacy",
      },
      {
        label: "Đóng",
        icon: "fa-solid fa-xmark",
        onClick: () => setOpen(false),
      },
    ],
    [],
  );

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      {open && (
        <div className="mb-3 w-72 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.65)] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-300">
                <i className="fa-solid fa-headset text-sm" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight">
                  Hỗ trợ nhanh
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Chọn một cách để liên hệ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
              aria-label="Đóng"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>

          <div className="p-2 space-y-1">
            {actions.map((a) => {
              if ("href" in a) {
                return (
                  <a
                    key={a.label}
                    href={a.href}
                    target={a.href.startsWith("http") ? "_blank" : undefined}
                    rel={a.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400">
                      <i className={`${a.icon} text-sm`} />
                    </span>
                    <span className="text-[13px] font-semibold">{a.label}</span>
                  </a>
                );
              }
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={a.onClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400">
                    <i className={`${a.icon} text-sm`} />
                  </span>
                  <span className="text-[13px] font-semibold">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 text-slate-950 shadow-[0_14px_40px_rgba(34,211,238,0.25)] hover:shadow-[0_18px_55px_rgba(34,211,238,0.35)] transition-shadow flex items-center justify-center"
        aria-label={open ? "Đóng hỗ trợ" : "Mở hỗ trợ"}
      >
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-comment-dots"} text-lg`} />
      </button>
    </div>
  );
};

export default ChatBubble;

