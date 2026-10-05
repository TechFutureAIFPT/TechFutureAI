"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSalesOps } from "@/lib/sales-ops-context";
import {
  assistant,
  type AssistantSessionSummary,
  type AssistantMessageRecord,
  type DeepResearchResponse,
} from "@/lib/assistant-endpoints";
import { APP_CONFIG } from "@/lib/config";
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
  Sparkles,
  Search,
  Globe,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Cpu,
} from "lucide-react";
import Link from "next/link";

const RECRUITER_SUGGESTIONS = [
  "Tôi nên chuẩn bị gì trước khi đăng một JD tuyển dụng kỹ sư phần mềm?",
  "Làm sao để phát hiện điểm yếu hoặc lỗ hổng kinh nghiệm trong CV ứng viên?",
  "Nên thiết lập tỷ trọng rubric như thế nào cho vị trí Trưởng nhóm Kinh doanh?",
  "Gợi ý 5 câu hỏi tình huống phỏng vấn chuyên sâu cho Senior Frontend React.",
];

const RESEARCH_SUGGESTIONS = [
  "Mặt bằng lương và phúc lợi nhân sự IT Việt Nam quý mới nhất 2026",
  "Quy định luật lao động mới về thời gian thử việc và đóng BHXH",
  "Xu hướng tuyển dụng nhân sự AI Engineering và Prompt Engineer tại Đông Nam Á",
  "Tiêu chuẩn đánh giá năng lực theo khung năng lực ASK (Attitude - Skills - Knowledge)",
];

export function AIAssistantSection() {
  const { authUser, authChecked, setIsAuthModalOpen } = useSalesOps();

  // Chế độ: "chat" (đàm thoại theo phiên) hoặc "research" (Deep Research đa nguồn)
  const [activeTab, setActiveTab] = useState<"chat" | "research">("chat");

  // State đàm thoại
  const [sessions, setSessions] = useState<AssistantSessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<AssistantMessageRecord[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // State Deep Research
  const [researchQuery, setResearchQuery] = useState("");
  const [researching, setResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<DeepResearchResponse | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadSessions = useCallback(async () => {
    if (!authUser) return;
    setSessionsLoading(true);
    try {
      const list = await assistant.listSessions(30);
      setSessions(Array.isArray(list) ? list : []);
    } catch {
      // Im lặng bỏ qua nếu chưa có session
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
      setMessages(Array.isArray(detail?.messages) ? detail.messages : []);
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải nội dung phiên trò chuyện.");
    } finally {
      setThreadLoading(false);
    }
  };

  const handleNewSession = async () => {
    if (!authUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveSessionId("");
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await assistant.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId("");
        setMessages([]);
      }
      toast.success("Đã xóa phiên trò chuyện.");
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa phiên.");
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    if (!authUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const optimisticUserMsg: AssistantMessageRecord = {
      id: `opt-${Date.now()}`,
      author: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInput("");
    setSending(true);

    try {
      let sid = activeSessionId;
      if (!sid) {
        const title = text.length > 30 ? text.slice(0, 30) + "…" : text;
        const created = await assistant.createSession(title);
        sid = created.id;
        setActiveSessionId(sid);
        setSessions((prev) => [{ id: sid, title, updatedAt: Date.now() }, ...prev]);
      }

      const res = await assistant.replySession(sid, text);
      const botMsg: AssistantMessageRecord = res?.assistantMessage || {
        id: `bot-${Date.now()}`,
        author: "bot",
        content: res?.responseText || "Không nhận được phản hồi.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);

      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== sid);
        const curr = prev.find((s) => s.id !== sid);
        return [{ id: sid, title: curr?.title || text.slice(0, 30), updatedAt: Date.now() }, ...updated];
      });
    } catch (err: any) {
      toast.error(err?.message || "Lỗi phản hồi từ Trợ lý AI.");
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          author: "bot",
          content: "⚠️ Đã xảy ra lỗi khi kết nối tới Trợ lý AI (Port 8080). Vui lòng thử lại.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleRunDeepResearch = async (queryToRun?: string) => {
    const q = (queryToRun || researchQuery).trim();
    if (!q || researching) return;

    if (!authUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setResearchQuery(q);
    setResearching(true);
    setResearchResult(null);

    try {
      const res = await assistant.deepResearch(q);
      setResearchResult(res);
      toast.success("Hoàn thành nghiên cứu đa nguồn!");
    } catch (err: any) {
      toast.error(err?.message || "Không thể thực hiện Deep Research.");
    } finally {
      setResearching(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 font-sans">
      {/* Cột danh sách phiên (chỉ hiện ở tab chat) */}
      {activeTab === "chat" && (
        <aside
          className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
            sidebarOpen ? "w-72" : "w-0 overflow-hidden border-r-0"
          }`}
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <button
              onClick={handleNewSession}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors w-full justify-center"
            >
              <Plus className="w-4 h-4" /> Cuộc trò chuyện mới
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Lịch sử hội thoại
            </div>
            {sessionsLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 text-center">
                Chưa có phiên trò chuyện nào.
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                    activeSessionId === s.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="truncate">{s.title || "Cuộc trò chuyện"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                    title="Xóa phiên"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1.5 justify-center">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            Backend Port 8080 (FastAPI AI)
          </div>
        </aside>
      )}

      {/* Vùng làm việc chính */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Thanh công cụ đỉnh */}
        <header className="h-14 border-b border-slate-200 px-4 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            {activeTab === "chat" && (
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title={sidebarOpen ? "Thu gọn thanh bên" : "Mở thanh bên"}
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Trợ Lý Tuyển Dụng AI & Deep Research
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                Port 8080
              </span>
            </div>
          </div>

          {/* Toggle Chế độ Chat vs Deep Research */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === "chat"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Trò chuyện AI
            </button>
            <button
              onClick={() => setActiveTab("research")}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === "research"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Deep Research
            </button>
          </div>
        </header>

        {/* Nội dung Tab: Chat */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Vùng hiển thị tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-xs">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Tôi có thể giúp gì cho đợt tuyển dụng của bạn?
                  </h2>
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    Hỏi đáp tự do về phân tích JD, lọc CV, tiêu chí chấm điểm, câu hỏi phỏng vấn hoặc chiến lược nhân sự.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                    {RECRUITER_SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(s)}
                        className="p-3 text-xs text-slate-700 bg-slate-50 hover:bg-indigo-50/60 hover:text-indigo-700 rounded-xl border border-slate-200 transition-all text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 max-w-3xl ${
                      m.author === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                        m.author === "user"
                          ? "bg-slate-900 text-white"
                          : "bg-indigo-600 text-white shadow-xs"
                      }`}
                    >
                      {m.author === "user" ? "HR" : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        m.author === "user"
                          ? "bg-indigo-600 text-white rounded-tr-xs"
                          : "bg-slate-100 text-slate-800 rounded-tl-xs whitespace-pre-wrap"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="flex gap-3 max-w-3xl mr-auto">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-100 text-slate-500 text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    Trợ lý AI đang suy nghĩ và tổng hợp dữ liệu...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Khung nhập tin nhắn */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="max-w-3xl mx-auto relative flex items-end bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all p-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Nhập câu hỏi cho Trợ lý tuyển dụng AI... (Enter để gửi)"
                  rows={1}
                  className="w-full resize-none bg-transparent border-0 focus:outline-hidden text-sm text-slate-800 placeholder-slate-400 px-2 py-1 max-h-48"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shrink-0 transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                SupportHR AI có thể đưa ra câu trả lời dựa trên kho tri thức tuyển dụng. Hãy kiểm tra các thông tin pháp lý quan trọng.
              </p>
            </div>
          </div>
        )}

        {/* Nội dung Tab: Deep Research */}
        {activeTab === "research" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Tiêu đề & Ô tìm kiếm Deep Research */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Nghiên cứu Chuyên sâu Tuyển dụng & Thị trường (Deep Research)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Truy xuất đa nguồn dữ liệu thời gian thực, tổng hợp báo cáo chuyên sâu và trích dẫn bằng chứng.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={researchQuery}
                      onChange={(e) => setResearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRunDeepResearch()}
                      placeholder="Nhập chủ đề cần nghiên cứu (VD: Mức lương Senior Data Analyst 2026)..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <button
                    onClick={() => handleRunDeepResearch()}
                    disabled={!researchQuery.trim() || researching}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors shadow-xs"
                  >
                    {researching ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang tra cứu...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" /> Bắt đầu Nghiên cứu
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400">Gợi ý chủ đề:</span>
                  {RESEARCH_SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRunDeepResearch(s)}
                      className="px-2.5 py-1 text-xs bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-300 border border-slate-200 rounded-lg transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kết quả Deep Research */}
              {researching ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-900">
                    Đang kích hoạt quy trình Deep Research...
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    AI đang trích xuất các nguồn web, đối chiếu văn bản quy phạm và tổng hợp báo cáo luận chứng. Quá trình có thể mất 15-30 giây.
                  </p>
                </div>
              ) : researchResult ? (
                <div className="space-y-6">
                  {/* Báo cáo tổng hợp */}
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        Báo Cáo Nghiên Cứu Tổng Hợp
                      </div>
                      <span className="text-xs text-slate-400">
                        Chủ đề: {researchResult.question}
                      </span>
                    </div>

                    <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {researchResult.report}
                    </div>
                  </div>

                  {/* Nguồn trích dẫn (Sources) */}
                  {researchResult.sources && researchResult.sources.length > 0 && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Nguồn Dữ Liệu Tham Chiếu ({researchResult.sources.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {researchResult.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl transition-all block group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 truncate">
                                {src.title || "Tài liệu trích dẫn"}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {src.content}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
