"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSalesOps } from "@/lib/sales-ops-context";
import {
  assistant,
  type AssistantSessionSummary,
  type AssistantMessageRecord,
} from "@/lib/assistant-endpoints";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  Plus,
  Trash2,
  MessageSquare,
  LogIn,
  ArrowLeft,
  ArrowUp,
  PanelLeft,
} from "lucide-react";

const SUGGESTIONS = [
  "Tôi nên chuẩn bị gì trước khi đăng một JD tuyển dụng?",
  "Làm sao để CV nổi bật hơn với nhà tuyển dụng?",
  "Nên đưa những tiêu chí nào vào bộ sàng lọc CV?",
  "Gợi ý cách viết mô tả công việc rõ ràng, thu hút.",
];

export function ChatbotSection() {
  const { authUser, authChecked, setIsAuthModalOpen } = useSalesOps();

  const [sessions, setSessions] = useState<AssistantSessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<AssistantMessageRecord[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadSessions = useCallback(async () => {
    if (!authUser) return;
    setSessionsLoading(true);
    try {
      const list = await assistant.listSessions(30);
      setSessions(Array.isArray(list) ? list : []);
    } catch {
      // Danh sách phiên là tiện ích phụ — im lặng bỏ qua, không chặn khung chat chính.
    } finally {
      setSessionsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Textarea tự giãn theo nội dung, tối đa ~8 dòng — đúng cảm giác composer của
  // các chatbot lớn thay vì ô nhập cố định 1 dòng.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const selectSession = async (id: string) => {
    if (id === activeSessionId || threadLoading) return;
    setActiveSessionId(id);
    setThreadLoading(true);
    setMessages([]);
    try {
      const detail = await assistant.getSession(id);
      setMessages(detail.messages || []);
    } catch {
      toast.error("Không tải được cuộc trò chuyện này");
      setActiveSessionId("");
    } finally {
      setThreadLoading(false);
    }
  };

  const newChat = () => {
    if (sending) return;
    setActiveSessionId("");
    setMessages([]);
    textareaRef.current?.focus();
  };

  const deleteSession = async (id: string) => {
    try {
      await assistant.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === activeSessionId) newChat();
      toast.success("Đã xóa cuộc trò chuyện");
    } catch {
      toast.error("Không xóa được cuộc trò chuyện, thử lại sau");
    }
  };

  const send = async (text?: string) => {
    const message = String(text ?? input).trim();
    if (!message || sending) return;

    if (!authUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setInput("");
    setSending(true);

    const optimisticUser: AssistantMessageRecord = {
      id: `local-${Date.now()}`,
      author: "user",
      content: message,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const created = await assistant.createSession(message.slice(0, 60));
        sessionId = created.id;
        setActiveSessionId(sessionId);
      }

      const result = await assistant.replySession(sessionId, message);
      setMessages((prev) => [...prev, result.assistantMessage]);
      loadSessions();
    } catch {
      toast.error("Không lấy được câu trả lời, thử lại sau");
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          author: "bot",
          content: "Xin lỗi, trợ lý chưa trả lời được ngay lúc này. Bạn thử gửi lại câu hỏi sau ít phút nhé.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send();
  };

  // authChecked phân biệt "chưa xác nhận xong phiên Firebase" (mỗi trang tự
  // tải riêng, xem sales-ops-context.tsx) với "đã xác nhận chắc chắn chưa đăng
  // nhập" — thiếu bước này, người đã đăng nhập ở trang khác sẽ thấy màn hình
  // "Cần đăng nhập" chớp qua trước khi tự sửa lại, trông như tài khoản không
  // đồng bộ giữa /chatbot và /dashboard dù thực chất vẫn cùng một phiên.
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-6 h-6 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-6 bg-white">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-5">
          <MessageSquare className="w-7 h-7 text-sky-600" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Cần đăng nhập để dùng Trợ Lý AI</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1.5">
          Đăng nhập để trò chuyện và lưu lại lịch sử hội thoại trên nhiều thiết bị.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="mt-5 inline-flex items-center gap-1.5 bg-sky-600 text-white hover:bg-sky-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar — flat conversation list, kiểu ChatGPT */}
      <aside
        className={`${sidebarOpen ? "w-[260px]" : "w-0"} shrink-0 h-full bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden transition-all duration-200`}
      >
        <div className="p-2.5 flex items-center gap-1.5 shrink-0">
          <a
            href="/dashboard"
            aria-label="Về không gian làm việc"
            title="Về không gian làm việc"
            className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <button
            onClick={newChat}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Cuộc trò chuyện mới
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {sessionsLoading ? (
            <div className="space-y-1.5 p-1.5">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center px-3 py-6">
              Chưa có cuộc trò chuyện nào
            </p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="group relative">
                <button
                  onClick={() => selectSession(s.id)}
                  className={`w-full text-left flex items-center px-3 py-2 rounded-lg text-xs transition-colors pr-7 ${
                    s.id === activeSessionId
                      ? "bg-slate-200/80 text-slate-900 font-semibold"
                      : "text-slate-600 hover:bg-slate-200/50"
                  }`}
                >
                  <span className="truncate">{s.title || "Cuộc trò chuyện mới"}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                  aria-label="Xóa cuộc trò chuyện"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 hover:bg-red-100/70 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-200 shrink-0 flex items-center gap-2">
          <img src="/brand/cvmatch-icon.png" alt="" className="w-6 h-6 rounded-md" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-800 truncate">CV Match</p>
            <p className="text-[10px] text-slate-400 truncate">Trợ lý AI tuyển dụng</p>
          </div>
        </div>
      </aside>

      {/* Main pane */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-12 shrink-0 flex items-center gap-2 px-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Ẩn danh sách hội thoại" : "Hiện danh sách hội thoại"}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-800">Trợ lý AI CV Match</span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {threadLoading ? (
            <div className="max-w-3xl mx-auto px-4 pt-8 space-y-4">
              <Skeleton className="h-16 w-2/3 rounded-2xl" />
              <Skeleton className="h-16 w-1/2 rounded-2xl ml-auto" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 text-center -mt-12">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-sky-50 border border-sky-100 flex items-center justify-center mb-4">
                <img
                  src="/brand/cvmatch-chatbot.png"
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Tôi có thể giúp gì cho bạn?</h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
                Hỏi về tuyển dụng, nghề nghiệp, CV hay JD — tôi trả lời và lưu lại lịch sử hội thoại.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full max-w-xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-xs text-slate-700 font-medium transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => {
                const isUser = msg.author === "user";
                if (isUser) {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[80%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-slate-100 text-slate-900">
                        {msg.content}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                      <img
                        src="/brand/cvmatch-chatbot.png"
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap pt-0.5">
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex gap-3 items-center">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                    <img
                      src="/brand/cvmatch-chatbot.png"
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer — pill nổi, kiểu ChatGPT */}
        <div className="shrink-0 px-4 pb-4 pt-1">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-end rounded-[26px] border border-slate-200 bg-white shadow-sm focus-within:border-sky-300 focus-within:shadow-md transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Hỏi Trợ lý AI CV Match…"
                className="flex-1 resize-none bg-transparent px-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none max-h-[200px]"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label="Gửi"
                className="m-2 w-9 h-9 shrink-0 rounded-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-400 mt-2.5">
              Trợ lý dựa trên kiến thức chung, không tra cứu số liệu thị trường thời gian thực. Luôn kiểm chứng thông tin quan trọng.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
