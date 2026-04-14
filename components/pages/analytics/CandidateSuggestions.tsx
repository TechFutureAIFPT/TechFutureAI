import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Sparkles, ChevronDown, ChevronUp, Check, Plus, FileText, Users, Lightbulb, MessageSquare, ArrowUp, X, Copy, CheckCheck, Loader2 } from 'lucide-react';
import type { Candidate, AnalysisRunData } from '../../../assets/types';
import { getChatbotAdvice } from '../../../services/ai-ml/models/gemini/geminiService';

const SELECTED_IDS_KEY = 'supporthr.selectedCandidateIds';

interface CandidateSuggestionsProps {
  candidates: Candidate[];
  jobPosition: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  candidateIds?: string[];
  timestamp?: number;
}

const QUICK_ACTIONS = [
  {
    label: 'Gợi ý ứng viên tiêu biểu',
    prompt: 'Hãy gợi ý cho tôi danh sách các ứng viên phù hợp nhất dựa trên kết quả lọc CV. Ghi rõ điểm mạnh cốt lõi và đề xuất ít nhất 3 câu hỏi phỏng vấn cho mỗi người để khai thác điểm yếu của họ.',
    icon: Lightbulb,
    color: '#60a5fa',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/15',
    textColor: 'text-blue-400',
  },
  {
    label: 'Phân nhóm theo cấp độ',
    prompt: 'Hãy phân nhóm các ứng viên theo cấp độ kinh nghiệm (Junior, Mid, Senior) và so sánh ưu khuyết điểm của từng nhóm.',
    icon: Users,
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/15',
    textColor: 'text-blue-400',
  },
  {
    label: 'So sánh top ứng viên',
    prompt: 'So sánh chi tiết top 3 ứng viên hàng đầu về kỹ năng, kinh nghiệm, và mức lương kỳ vọng.',
    icon: MessageSquare,
    color: '#2563eb',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/15',
    textColor: 'text-blue-400',
  },
  {
    label: 'Tạo câu hỏi phỏng vấn',
    prompt: 'Dựa trên top ứng viên, hãy tạo danh sách câu hỏi phỏng vấn chuyên sâu cho từng người, bao gồm cả câu hỏi kỹ thuật và hành vi.',
    icon: Sparkles,
    color: '#1d4ed8',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/15',
    textColor: 'text-blue-400',
  },
];

const CandidateSuggestions: React.FC<CandidateSuggestionsProps> = ({ candidates, jobPosition }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_IDS_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const analysisData: AnalysisRunData = {
    timestamp: Date.now(),
    job: { position: jobPosition, locationRequirement: localStorage.getItem('currentLocation') || '' },
    candidates,
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: 'Xin chào! Tôi là **Trợ lý tuyển dụng AI** của Support HR.\n\nTôi có thể giúp bạn:\n• Gợi ý ứng viên phù hợp nhất với JD\n• So sánh chi tiết hồ sơ ứng viên\n• Tạo câu hỏi phỏng vấn chuyên sâu\n• Phân nhóm ứng viên theo cấp độ\n\n**Bắt đầu bằng cách chọn một gợi ý bên dưới hoặc đặt câu hỏi trực tiếp!**',
      timestamp: Date.now(),
    }]);
  }, []);

  const handleSend = async (userMsg: string) => {
    if (!userMsg.trim()) return;
    const userMessage: Message = { role: 'user', content: userMsg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await getChatbotAdvice(analysisData, userMsg);
      const assistantMessage: Message = { role: 'assistant', content: result.responseText, candidateIds: result.candidateIds, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => { setInput(''); handleSend(prompt); };

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      try { localStorage.setItem(SELECTED_IDS_KEY, JSON.stringify(Array.from(n))); } catch { }
      return n;
    });
  }, []);

  const exportSelectedToCSV = () => {
    if (selectedIds.size === 0) return;
    const selectedData = candidates.filter(c => selectedIds.has(c.id!));
    const headers = ['STT', 'Họ tên', 'Hạng', 'Điểm tổng', 'Phù hợp JD', 'Chức danh', 'Email', 'SĐT'];
    const csvData = [
      headers.join(','),
      ...selectedData.map((c, index) => [
        index + 1, c.candidateName || '', c.status === 'FAILED' ? 'FAILED' : (c.analysis?.['Hạng'] || 'C'),
        c.status === 'FAILED' ? '0' : String(c.analysis?.['Tổng điểm'] || 0),
        `${c.analysis?.['Chi tiết']?.find(i => i['Tiêu chí'].startsWith('Phù hợp JD'))?.['Điểm'].split('/')[0] || 0}%`,
        c.jobTitle || '', c.email || '', c.phone || ''
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ung_vien_duoc_chon_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const formatBold = (str: string) => {
        const parts = str.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="text-blue-300 font-bold">{part.slice(2, -2)}</strong>
            : <React.Fragment key={i}>{part}</React.Fragment>
        );
      };
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return <li key={index} className="ml-5 list-disc marker:text-blue-400 my-1 text-slate-200 leading-relaxed">{formatBold(line.trim().substring(2))}</li>;
      }
      if (/^(\d+\.|\*\*\d+\.)/.test(line.trim())) {
        return <div key={index} className="my-2.5 ml-1 text-blue-300 font-semibold text-sm">{formatBold(line)}</div>;
      }
      if (line.trim() === '') return <div key={index} className="h-2" />;
      return <p key={index} className="text-slate-200 leading-relaxed">{formatBold(line)}</p>;
    });
  };

  const GradeBadge = ({ grade }: { grade?: string }) => {
    if (!grade) return null;
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
        grade === 'A' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
        grade === 'B' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
        'bg-blue-500/15 text-blue-400 border border-blue-500/20'
      }`}>Hạng {grade}</span>
    );
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase() : name.charAt(0).toUpperCase();
  };

  if (!candidates || candidates.length === 0) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#0d1220] to-[#0a0e1a] px-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center border border-slate-800/60 bg-[#0B1628] shadow-2xl shadow-black/30">
          <Bot className="w-10 h-10 text-slate-600" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">Chưa có dữ liệu ứng viên</h2>
        <p className="max-w-sm text-sm text-slate-400 leading-relaxed">Vui lòng chạy phân tích CV trước để sử dụng tính năng gợi ý ứng viên AI.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#0d1220] to-[#0a0e1a]">
      {/* Wrapper: chat + sidebar cùng flex-row để sidebar chiếm không gian khi mở */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

      {/* ── Chat Area ─────────────────────────────────────────── */}
      <div className="flex min-h-0 min-w-0 flex-col flex-1 transition-all duration-300">

        {/* Chat Header */}
        <div className="shrink-0 border-b border-slate-800/50 bg-[#0a0e1a]/90 backdrop-blur-xl px-4 pb-3 md:px-6 md:pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-400 rounded-full border-2 border-[#0a0e1a] shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">Trợ lý tuyển dụng AI</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
                  <span className="text-[10px] text-blue-400 font-medium">Đang hoạt động</span>
                  <span className="text-[10px] text-slate-600">·</span>
                  <span className="text-[10px] text-slate-500">{jobPosition}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`w-9 h-9 border transition-all flex items-center justify-center ${
                  sidebarOpen
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                }`}
                title="Danh sách ứng viên"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="shrink-0 border-b border-slate-800/50 bg-[#0a0e1a]/50 px-4 pb-3 md:px-6 md:pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gợi ý nhanh</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0 ${action.bg} ${action.border} ${action.hoverBg} ${action.textColor} disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-black/20`}
              >
                <action.icon className="w-3.5 h-3.5 flex-shrink-0" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const isExpanded = expandedMsg === i;
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[88%] p-4 shadow-xl transition-all ${
                  isUser
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-900/30'
                    : 'bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-800/60 text-slate-200 shadow-black/30'
                }`}>
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-800/40">
                      <div className="w-7 h-7 bg-blue-500/15 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-300">Support HR AI</span>
                      <span className="ml-auto text-[9px] text-slate-600">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  )}

                  <div className={`${isUser ? 'text-sm' : 'text-sm'} leading-relaxed`}>
                    {(msg.content.length > 600 && !isExpanded) ? (
                      <>
                        {formatContent(msg.content.substring(0, 600) + '...')}
                        <button
                          onClick={() => setExpandedMsg(i)}
                          className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                          Xem thêm
                        </button>
                      </>
                    ) : (
                      <>
                        {formatContent(msg.content)}
                        {msg.content.length > 600 && isExpanded && (
                          <button
                            onClick={() => setExpandedMsg(null)}
                            className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                            Thu gọn
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Suggested candidates */}
                  {!isUser && msg.candidateIds && msg.candidateIds.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/40">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
                        <p className="text-[11px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3 h-3" />
                          Ứng viên được đề xuất ({msg.candidateIds.length})
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {msg.candidateIds.map(id => {
                          const c = candidates.find(cand => cand.id === id);
                          if (!c) return null;
                          const isSelected = selectedIds.has(id);
                          return (
                            <div key={id} className={`flex items-center justify-between gap-3 p-3 border transition-all duration-200 ${
                              isSelected
                                ? 'border-blue-500/40 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                                : 'border-slate-700/50 bg-slate-800/30 hover:border-blue-500/30 hover:bg-slate-800/50'
                            }`}>
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <div className={`w-8 h-8 flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                                  c.analysis?.['Hạng'] === 'A' ? 'bg-blue-500/20 text-blue-400' :
                                  c.analysis?.['Hạng'] === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {getInitials(c.candidateName || '')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-bold text-white truncate">{c.candidateName}</p>
                                    <GradeBadge grade={c.analysis?.['Hạng']} />
                                  </div>
                                  <p className="text-[10px] text-slate-400 truncate">{c.jobTitle || 'Chưa rõ chức danh'}</p>
                                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-300">
                                    <span>Điểm: <span className="font-bold text-white">{c.analysis?.['Tổng điểm']}</span></span>
                                    <span>Cấp: <span className="font-semibold">{c.experienceLevel || '—'}</span></span>
                                    {c.email && <span className="text-blue-400 truncate">{c.email}</span>}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleToggleSelect(id!)}
                                className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-600/20'
                                    : 'bg-slate-700/80 hover:bg-slate-600 text-slate-200 border border-slate-600/40'
                                }`}
                              >
                                {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                {isSelected ? 'Đã chọn' : 'Chọn'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Message actions */}
                  {!isUser && (
                    <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-slate-700/30">
                      <button
                        onClick={() => handleCopy(msg.content, `msg-${i}`)}
                        className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors px-2 py-1 hover:bg-slate-800/50"
                      >
                        {copiedId === `msg-${i}` ? <CheckCheck className="w-3 h-3 text-blue-400" /> : <Copy className="w-3 h-3" />}
                        {copiedId === `msg-${i}` ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-800/60 text-slate-200 p-5 flex flex-col gap-3 shadow-xl shadow-black/20 max-w-md">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-blue-500/15 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-300">Support HR AI</span>
                  <div className="ml-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-slate-800 animate-pulse w-48" />
                  <div className="h-2 rounded-full bg-slate-800 animate-pulse w-32" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-slate-800/50 bg-[#0a0e1a]/90 backdrop-blur-xl px-4 py-4 md:px-6">
          <div className="relative">
            <div className="flex items-center gap-3 bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-700/50 px-4 py-3 focus-within:border-blue-500/50 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all">
              <Bot className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder="Nhập câu hỏi hoặc yêu cầu về ứng viên..."
                className="flex-1 min-h-[24px] max-h-32 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none resize-y"
                disabled={isLoading}
                rows={1}
              />
              <button
                onClick={() => { if (input.trim()) { handleSend(input); } }}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center transition shadow-lg shadow-blue-900/30 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 hover:scale-105 active:scale-95"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[9px] text-slate-600 font-medium">
                Nhấn Enter để gửi · Shift + Enter để xuống dòng
              </span>
              {selectedIds.size > 0 && (
                <span className="text-[9px] text-blue-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {selectedIds.size} ứng viên đã chọn
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Candidate Sidebar ────────────────────────────────── */}
      {sidebarOpen && (
        <div className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-t border-slate-800/50 bg-[#0a0e1a] md:w-[320px] md:border-l md:border-t-0">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800/50 px-4 py-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Ứng viên đã chọn
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{selectedIds.size} / {candidates.filter(c => c.status === 'SUCCESS').length} ứng viên</p>
            </div>
            {selectedIds.size > 0 && (
              <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/10">
                {selectedIds.size}
              </div>
            )}
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {selectedIds.size === 0 ? (
              <div className="flex min-h-[14rem] flex-col items-center justify-center p-4 text-center">
                <div className="w-14 h-14 bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4 shadow-lg">
                  <Users className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-xs text-slate-500 font-medium">Chưa có ứng viên nào được chọn</p>
                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">Trò chuyện với AI và bấm "Chọn" để thêm vào danh sách</p>
              </div>
            ) : (
              Array.from(selectedIds).map(id => {
                const c = candidates.find(cand => cand.id === id);
                if (!c) return null;
                return (
                  <div key={id} className="p-3.5 bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-800/60 relative group hover:border-blue-500/30 transition-all shadow-lg shadow-black/10">
                    <button
                      onClick={() => handleToggleSelect(id)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 bg-slate-800/80 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all border border-slate-700/40 hover:border-red-500/30"
                      title="Bỏ chọn"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2.5 mb-2.5 pr-7">
                      <div className={`w-9 h-9 flex items-center justify-center text-xs font-black ${
                        c.analysis?.['Hạng'] === 'A' ? 'bg-blue-500/20 text-blue-400' :
                        c.analysis?.['Hạng'] === 'B' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {getInitials(c.candidateName || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate pr-4">{c.candidateName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{c.jobTitle || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <GradeBadge grade={c.analysis?.['Hạng']} />
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700/40">
                        Điểm: <span className="text-white">{c.analysis?.['Tổng điểm']}</span>
                      </span>
                      <span className="text-[10px] text-slate-500">{c.experienceLevel || '—'}</span>
                    </div>
                    {c.email && (
                      <p className="text-[10px] text-blue-400 mt-2 truncate">{c.email}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="shrink-0 border-t border-slate-800/50 p-3 md:p-4 bg-[#0a0e1a]/80">
            <button
              onClick={exportSelectedToCSV}
              disabled={selectedIds.size === 0}
              className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2.5 transition-all bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20 disabled:opacity-30 disabled:cursor-not-allowed border border-blue-400/20 hover:shadow-blue-500/30"
            >
              <FileText className="w-4 h-4" />
              Xuất danh sách ({selectedIds.size})
            </button>
          </div>
        </div>
      )}
      </div>{/* end wrapper flex-row */}
    </div>
  );
};

export default CandidateSuggestions;
