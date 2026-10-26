"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useSalesOps } from "@/lib/sales-ops-context";
import {
  careerCompassApi,
  type CareerChatMessage,
  type CareerAdvisorData,
  type SurveyQuestionItem,
  type CareerProfileResult,
  type RoadmapMilestone,
} from "@/lib/career-compass-endpoints";
import { APP_CONFIG } from "@/lib/config";
import { AssistantMessageContent } from "./assistant-message-content";
import {
  Compass,
  Sparkles,
  Send,
  ArrowUp,
  BrainCircuit,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Calendar,
  Layers,
  RefreshCw,
  Cpu,
} from "lucide-react";

// Bộ câu hỏi RIASEC mẫu khi offline hoặc chưa nạp từ server
const DEFAULT_RIASEC_QUESTIONS: SurveyQuestionItem[] = [
  { id: "q1", code: "R1", category: "R", text: "Thích sửa chữa các thiết bị gia dụng hoặc máy móc cơ khí" },
  { id: "q2", code: "R2", category: "R", text: "Thích làm việc ngoài trời, vận động hoặc xây dựng mô hình thực tế" },
  { id: "q3", code: "I1", category: "I", text: "Thích giải các bài toán logic phức tạp hoặc nghiên cứu quy luật tự nhiên" },
  { id: "q4", code: "I2", category: "I", text: "Thích tìm hiểu nguyên nhân gốc rễ và cơ chế hoạt động của công nghệ mới" },
  { id: "q5", code: "A1", category: "A", text: "Thích vẽ, sáng tạo nội dung, thiết kế đồ họa hoặc viết kịch bản" },
  { id: "q6", code: "A2", category: "A", text: "Thích môi trường làm việc tự do, không gò bó theo khuôn khổ cứng nhắc" },
  { id: "q7", code: "S1", category: "S", text: "Thích giảng dạy, hướng dẫn hoặc tư vấn hỗ trợ người khác giải quyết vấn đề" },
  { id: "q8", code: "S2", category: "S", text: "Quan tâm đến tâm lý con người và mong muốn tạo giá trị cho cộng đồng" },
  { id: "q9", code: "E1", category: "E", text: "Thích thuyết phục, đàm phán hoặc dẫn dắt đội ngũ hoàn thành mục tiêu" },
  { id: "q10", code: "E2", category: "E", text: "Hứng thú với kinh doanh, khởi nghiệp, bán hàng hoặc quản lý dự án" },
  { id: "q11", code: "C1", category: "C", text: "Thích làm việc với các bảng biểu, số liệu kế toán và dữ liệu chi tiết" },
  { id: "q12", code: "C2", category: "C", text: "Thích tuân thủ quy trình chuẩn mực, ngăn nắp và có kế hoạch cụ thể" },
];

const DEFAULT_ROADMAP: RoadmapMilestone[] = [
  {
    month: "Tháng 1 - 3",
    title: "Định vị Năng lực & Khám phá Bản thân",
    description: "Thực hiện trắc nghiệm RIASEC, xác định nhóm tính cách và các ngành nghề cốt lõi phù hợp.",
    action_items: [
      "Hoàn thành bài khảo sát Holland để lấy mã nghề nghiệp cá nhân",
      "Lập danh sách 3-5 ngành học mục tiêu và tìm hiểu đề án tuyển sinh 2026",
      "Đánh giá điểm mạnh/yếu về học lực các môn tổ hợp xét tuyển",
    ],
    category: "career",
  },
  {
    month: "Tháng 4 - 6",
    title: "Xây dựng Hồ sơ Năng lực & Chứng chỉ",
    description: "Ôn tập thi chứng chỉ quốc tế và hoàn thiện hồ sơ xét tuyển sớm.",
    action_items: [
      "Tham gia kỳ thi Đánh giá Năng lực (ĐHQG HN/TP.HCM/Bách Khoa)",
      "Thi chứng chỉ ngoại ngữ (IELTS/TOEFL/VSTEP) để quy đổi điểm",
      "Chuẩn bị học bạ THPT và các giải thưởng học sinh giỏi nếu có",
    ],
    category: "exam",
  },
  {
    month: "Tháng 7 - 9",
    title: "Đăng ký Nguyện vọng & Nhập học",
    description: "Chiến lược sắp xếp thứ tự nguyện vọng an toàn theo phổ điểm và nhập học.",
    action_items: [
      "Sắp xếp nguyện vọng theo ma trận: Nhóm mạo hiểm (1-2), Nhóm vừa sức (3-4), Nhóm an toàn (5-6)",
      "Theo dõi hệ thống tuyển sinh của Bộ GD&ĐT và xác nhận nhập học trực tuyến",
      "Chuẩn bị kỹ năng mềm và làm quen với môi trường đại học",
    ],
    category: "admission",
  },
];

export function CareerCompassSection() {
  const { authUser, setIsAuthModalOpen } = useSalesOps();

  const [activeTab, setActiveTab] = useState<"advisor" | "riasec" | "roadmap">("riasec");

  // State Cố vấn AI
  const [messages, setMessages] = useState<CareerChatMessage[]>([
    {
      sender: "assistant",
      content:
        "Tôi có thể giúp bạn tìm hiểu nghề nghiệp, khám phá sở thích qua Holland RIASEC và tham khảo ngành học. Hãy chia sẻ mục tiêu, sở thích hoặc điều bạn đang cân nhắc để bắt đầu.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [useDeepResearch, setUseDeepResearch] = useState(true);
  const [latestAdvisorData, setLatestAdvisorData] = useState<CareerAdvisorData | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState(false);

  // State Khảo sát RIASEC
  const [questions, setQuestions] = useState<SurveyQuestionItem[]>(DEFAULT_RIASEC_QUESTIONS);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [profileResult, setProfileResult] = useState<CareerProfileResult | null>(null);
  const [localResult, setLocalResult] = useState(false);

  // State Lộ trình
  const [roadmap, setRoadmap] = useState<RoadmapMilestone[]>(DEFAULT_ROADMAP);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }, [messages, chatLoading]);

  // Tải danh sách câu hỏi RIASEC từ API khi mở tab
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await careerCompassApi.getSurveyQuestions();
        if (res?.data?.holland_riasec && res.data.holland_riasec.length > 0) {
          setQuestions(res.data.holland_riasec.map((question) => ({
            ...question,
            category: question.category || question.code?.[0] || "",
            code: question.code || question.id,
          })));
        }
      } catch {
        // Sử dụng danh sách mặc định nếu server bận
      }
    }
    fetchQuestions();
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    if (!profileResult?.holland_code || !profileResult.riasec_scores) {
      setActiveTab("riasec");
      toast.warning("Hãy hoàn thành khảo sát RIASEC để mở phần tư vấn.");
      return;
    }
    const text = (textToSend || chatInput).trim();
    if (!text || chatLoading) return;

    const userMsg: CareerChatMessage = { sender: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({ sender: m.sender, content: m.content }));
      const res = await careerCompassApi.sendMessage({
        message: text,
        user_id: authUser?.uid,
        conversation_history: history,
        student_profile_context: {
          holland: {
            holland_code: profileResult.holland_code,
            riasec_scores: profileResult.riasec_scores,
          },
        },
        use_deep_research: useDeepResearch,
      });

      const advisorData = res.data;
      setLatestAdvisorData(advisorData);

      const botMsg: CareerChatMessage = {
        sender: "assistant",
        content: advisorData.reply || "Cố vấn đã tiếp nhận câu hỏi của bạn.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      toast.error(err?.message || "Không thể kết nối tới Cố vấn Hướng nghiệp AI.");
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          content: "Chưa thể kết nối với cố vấn nghề nghiệp. Vui lòng thử lại sau ít phút.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAnswerChange = (qId: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    setProfileResult(null);
    setLocalResult(false);
    setActiveTab("riasec");
  };

  const handleSubmitSurvey = async () => {
    if (surveySubmitting) return;
    const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
    if (answeredCount < questions.length) {
      toast.warning(`Bạn đã trả lời ${answeredCount}/${questions.length} câu. Hãy hoàn thành các câu còn lại trước khi xem kết quả.`);
      return;
    }

    setLocalResult(false);
    setSurveySubmitting(true);
    try {
      const res = await careerCompassApi.submitSurvey({
        user_id: authUser?.uid,
        student_name: authUser?.displayName || "Ứng viên",
        riasec_answers: answers,
      });

      if (res?.data) {
        setProfileResult(res.data);
        setActiveTab("advisor");
        toast.success("Đã hoàn thành đánh giá hồ sơ nghề nghiệp RIASEC!");
      }
    } catch (err: any) {
      // Fallback tính toán cục bộ nếu backend offline
      const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
      questions.forEach((q) => {
        const val = answers[q.id] || 3;
        const cat = q.category as keyof typeof scores;
        if (scores[cat] !== undefined) scores[cat] += val;
      });

      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const hollandCode = sorted.slice(0, 3).map((e) => e[0]).join("");

      setProfileResult({
        student_name: authUser?.displayName || "Ứng viên",
        riasec_scores: scores,
        holland_code: hollandCode,
        primary_traits: [
          `Nhóm nổi trội 1: ${sorted[0][0]} (${sorted[0][1]} điểm)`,
          `Nhóm nổi trội 2: ${sorted[1][0]} (${sorted[1][1]} điểm)`,
          `Nhóm nổi trội 3: ${sorted[2][0]} (${sorted[2][1]} điểm)`,
        ],
        recommended_majors: [],
        recommended_careers: [],
        guidance_summary: `Mã sở thích tham khảo của bạn là ${hollandCode}, được tổng hợp từ câu trả lời trên thiết bị. Kết quả này chưa bao gồm tư vấn cá nhân từ dịch vụ. Hãy đối chiếu với kinh nghiệm, năng lực và mục tiêu thực tế của bạn.`,
      });
      setLocalResult(true);
      setActiveTab("advisor");
      toast.info("Đã tổng hợp điểm sở thích trên thiết bị. Dịch vụ tư vấn hiện chưa khả dụng.");
    } finally {
      setSurveySubmitting(false);
    }
  };

  const RIASEC_CATEGORIES = [
    { key: "R", name: "Kỹ thuật (Realistic)", desc: "Thực tế, thích máy móc, công cụ" },
    { key: "I", name: "Nghiên cứu (Investigative)", desc: "Tư duy logic, giải quyết vấn đề" },
    { key: "A", name: "Nghệ thuật (Artistic)", desc: "Sáng tạo, trực giác, thẩm mỹ" },
    { key: "S", name: "Xã hội (Social)", desc: "Thấu cảm, giúp đỡ, đào tạo" },
    { key: "E", name: "Quản lý (Enterprising)", desc: "Thuyết phục, dẫn dắt, kinh doanh" },
    { key: "C", name: "Nghiệp vụ (Conventional)", desc: "Ngăn nắp, cẩn thận, quy trình" },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-white font-sans overflow-hidden">
      {/* Header thanh điều hướng */}
      <header className="chat-toolbar">
        <div className="chat-toolbar-title"><Compass size={19} className="text-primary" /><span>Cố vấn nghề nghiệp</span></div>
        <div className="chat-mode-tabs" role="group" aria-label="Công cụ định hướng nghề nghiệp">
          {([{ id: "advisor", label: "Cố vấn AI" }, { id: "riasec", label: "Khảo sát RIASEC" }, { id: "roadmap", label: "Lộ trình tham khảo" }] as const).map((tab) => {
            const locked = tab.id === "advisor" && !profileResult;
            return <button key={tab.id} aria-pressed={activeTab === tab.id} aria-disabled={locked} disabled={locked} title={locked ? "Hoàn thành khảo sát RIASEC để mở cố vấn" : undefined} onClick={() => setActiveTab(tab.id)}>{tab.label}{locked ? " · Cần khảo sát" : ""}</button>;
          })}
        </div>
      </header>

      {/* VÙNG NỘI DUNG CHÍNH */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        {/* TAB 1: CỐ VẤN AI (CHATBOT) */}
        {activeTab === "advisor" && (
          <div className="flex-1 flex flex-col h-full min-h-0">
            {/* Vùng tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 1 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-2 py-6">
                  <span className="w-14 h-14 rounded-2xl bg-secondary text-primary flex items-center justify-center mb-5"><Compass size={28} strokeWidth={1.5} /></span>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">Tìm hướng đi phù hợp với bạn</h2>
                  <p className="text-sm text-muted-foreground mt-3 mb-6 leading-relaxed max-w-lg">Bắt đầu từ sở thích, thế mạnh hoặc mục tiêu của bạn. cố vấn AI giúp bạn tìm hiểu các lựa chọn và những bước chuẩn bị tiếp theo.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left w-full max-w-xl">
                    {["Tôi chưa biết mình phù hợp với nhóm nghề nào.", "Tôi muốn tìm hiểu cơ hội trong ngành công nghệ.", "Tôi cần chuẩn bị gì khi muốn chuyển hướng nghề nghiệp?", "Giải thích giúp tôi về khảo sát Holland RIASEC."].map((suggestion) => <button key={suggestion} onClick={() => setChatInput(suggestion)} className="p-3.5 rounded-xl border border-border bg-slate-50 text-xs text-slate-600 hover:bg-secondary hover:text-primary text-left leading-relaxed">{suggestion}</button>)}
                  </div>
                </div>
              ) : messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-3xl ${
                    m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      m.sender === "user"
                        ? "bg-slate-900 text-white"
                        : "bg-teal-600 text-white shadow-xs"
                    }`}
                  >
                    {m.sender === "user" ? "BẠN" : <Compass className="w-4 h-4" />}
                  </div>

                  <div className="space-y-2 max-w-2xl">
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        m.sender === "user"
                          ? "bg-teal-600 text-white rounded-tr-xs"
                          : "bg-slate-100 text-slate-800 rounded-tl-xs whitespace-pre-wrap"
                      }`}
                    >
                      {m.sender === "assistant" ? <AssistantMessageContent content={m.content} /> : m.content}
                    </div>

                    {/* Hiển thị Reasoning CoT & Citations cho tin nhắn cuối của bot */}
                    {m.sender === "assistant" && idx === messages.length - 1 && latestAdvisorData && (
                      <div className="space-y-2 pt-1">
                        {/* Khối suy luận logic */}
                        {latestAdvisorData.reasoning_content && (
                          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                            <button
                              onClick={() => setExpandedReasoning((v) => !v)}
                              className="flex items-center justify-between w-full font-semibold text-amber-800"
                            >
                              <span className="flex items-center gap-1.5">
                                <BrainCircuit className="w-3.5 h-3.5 text-amber-600" />
                                Phân tích bổ sung
                              </span>
                              {expandedReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            {expandedReasoning && (
                              <p className="mt-2 text-slate-700 leading-relaxed whitespace-pre-wrap border-t border-amber-200/60 pt-2 font-mono text-[11px]">
                                {latestAdvisorData.reasoning_content}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Nguồn trích dẫn pháp lý & đề án */}
                        {latestAdvisorData.citations && latestAdvisorData.citations.length > 0 && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                              Căn cứ dữ liệu trích dẫn:
                            </span>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {latestAdvisorData.citations.map((c, cIdx) => (
                                <a
                                  key={cIdx}
                                  href={c.url || c.source_url || undefined}
                                  target={c.url || c.source_url ? "_blank" : undefined}
                                  rel={c.url || c.source_url ? "noreferrer" : undefined}
                                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600"
                                >
                                  {c.title || c.source_title || "Nguồn tham khảo"}{c.verified === false ? " · chưa xác minh" : ""}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Gợi ý câu hỏi tiếp theo */}
                        {(latestAdvisorData.suggested_followups || latestAdvisorData.recommended_followups || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(latestAdvisorData.suggested_followups || latestAdvisorData.recommended_followups || []).map((q, qIdx) => (
                              <button
                                key={qIdx}
                                onClick={() => handleSendMessage(q)}
                                className="px-2.5 py-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg transition-colors text-left"
                              >
                                💡 {q}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3 max-w-3xl mr-auto">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs shrink-0 animate-pulse">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-100 text-slate-500 text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                    Đang tổng hợp thông tin cho câu hỏi của bạn…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input thanh gửi câu hỏi */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="max-w-3xl mx-auto space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useDeepResearch}
                      onChange={(e) => setUseDeepResearch(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Tham khảo thêm nguồn trực tuyến</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Thông tin hỗ trợ định hướng</span>
                </div>

                <div className="relative flex items-center bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 p-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    aria-label="Câu hỏi định hướng nghề nghiệp" placeholder="Chia sẻ mục tiêu hoặc câu hỏi về nghề nghiệp…"
                    className="w-full bg-transparent border-0 focus:outline-hidden text-sm text-slate-800 placeholder-slate-400 px-2"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    aria-label="Gửi câu hỏi hướng nghiệp"
                    disabled={!chatInput.trim() || chatLoading}
                    className="p-2 text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-xl shrink-0 transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRẮC NGHIỆM TÂM LÝ NGHỀ NGHIỆP HOLLAND (RIASEC) */}
        {activeTab === "riasec" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Giới thiệu bài trắc nghiệm */}
              <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-teal-950 mb-1">
                  Khảo sát sở thích nghề nghiệp Holland RIASEC
                </h2>
                <p className="text-xs text-teal-800 leading-relaxed">
                  Đánh giá mức độ yêu thích của bạn đối với từng hoạt động (từ 1: Hoàn toàn không thích đến 5: Rất thích).
                  Kết quả giúp bạn tham khảo các nhóm sở thích nghề nghiệp, kết hợp với năng lực và mục tiêu cá nhân.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-teal-200/60 text-xs">
                  {RIASEC_CATEGORIES.map((c) => (
                    <div key={c.key} className="p-2 bg-white/80 rounded-lg border border-teal-100">
                      <span className="font-bold text-teal-900">{c.key}</span> - {c.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Danh sách câu hỏi */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center justify-between">
                  <span>Câu hỏi khảo sát ({questions.length} câu)</span>
                  <span className="text-xs text-slate-500 font-normal">
                    Đã hoàn thành: {Object.keys(answers).length}/{questions.length}
                  </span>
                </h3>

                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const currentVal = answers[q.id] || 0;
                    return (
                      <div
                        key={q.id}
                        className="p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            Câu {idx + 1} • Nhóm {q.category}
                          </span>
                          <p className="text-sm font-medium text-slate-800">{q.text}</p>
                        </div>

                        {/* Điểm số từ 1 đến 5 */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              onClick={() => handleAnswerChange(q.id, val)}
                              aria-label={`Câu ${idx + 1}: mức ${val} trên 5`}
                              aria-pressed={currentVal === val}
                              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                                currentVal === val
                                  ? "bg-teal-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSubmitSurvey}
                    disabled={surveySubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {surveySubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang phân tích hồ sơ...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" /> Xem kết quả khảo sát
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* KẾT QUẢ HỒ SƠ HƯỚNG NGHIỆP NẾU CÓ */}
              {profileResult && (
                <div className="bg-white border-2 border-teal-500 rounded-2xl p-6 shadow-md space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-teal-600">
                        {localResult ? "Kết quả tổng hợp trên thiết bị" : "Kết quả khảo sát nghề nghiệp"}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                        Mã sở thích Holland:{" "}
                        <span className="text-teal-600 font-extrabold">{profileResult.holland_code}</span>
                      </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg">
                      {profileResult.holland_code?.slice(0, 2)}
                    </div>
                  </div>

                  {/* Biểu đồ phân bổ 6 nhóm điểm */}
                  {profileResult.riasec_scores && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                        Phân bố điểm sở thích theo nhóm
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(profileResult.riasec_scores).map(([key, val]) => (
                          <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                              <span>Nhóm {key}</span>
                              <span className="text-teal-700">{val} điểm</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (Number(val) / Math.max(1, questions.filter((question) => question.category === key).length * 5)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Đề xuất ngành & nghề nghiệp */}
                  {!localResult && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2">
                      <h5 className="text-xs font-bold text-teal-900 uppercase flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-teal-700" />
                        Ngành học tham khảo
                      </h5>
                      <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                        {profileResult.recommended_majors?.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <h5 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-slate-700" />
                        Nhóm nghề tham khảo
                      </h5>
                      <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                        {profileResult.recommended_careers?.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>}

                  {profileResult.guidance_summary && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-900">Lời khuyên cố vấn: </span>
                      {profileResult.guidance_summary}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LỘ TRÌNH TUYỂN SINH LỚP 12 & NGHỀ NGHIỆP */}
        {activeTab === "roadmap" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-1 mb-8">
                <h2 className="text-xl font-bold text-slate-900">
                  Lộ trình chuẩn bị học tập & nghề nghiệp
                </h2>
                <p className="text-xs text-slate-500">
                  Lộ trình mẫu để tham khảo. Điều chỉnh theo mục tiêu của bạn và kiểm tra lịch chính thức của từng cơ sở đào tạo.
                </p>
              </div>

              <div className="relative border-l-2 border-teal-200 ml-4 pl-6 space-y-8">
                {roadmap.map((stage, idx) => (
                  <div key={idx} className="relative group">
                    {/* Icon điểm mốc */}
                    <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {idx + 1}
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                          {stage.month}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">
                          Chuyên mục: {stage.category}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{stage.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{stage.description}</p>

                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase">
                          Các hành động cần làm:
                        </span>
                        {stage.action_items.map((item, aIdx) => (
                          <div key={aIdx} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
