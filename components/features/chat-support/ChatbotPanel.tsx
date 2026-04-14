import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { AnalysisRunData, ChatMessage } from '../../../assets/types';
import { getChatbotAdvice } from '../../../services/ai-ml/models/gemini/geminiService';
import { analyzeSalary } from '../../../services/salary-analysis/salaryAnalysisService';

interface ChatbotPanelProps {
  analysisData: AnalysisRunData;
  onClose?: () => void;
}

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ analysisData, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'initial', author: 'bot', content: 'Chào bạn, tôi là trợ lý AI. Tôi có thể giúp gì cho bạn với danh sách ứng viên này?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build dynamic suggestions based on candidate/job context
  const suggestions = useMemo(() => {
    const cands = analysisData?.candidates || [];
    const jobTitle = analysisData.job.position;
    if (!cands.length) {
      return [
        `Ứng viên nào phù hợp nhất với vị trí ${jobTitle}?`,
        `3 ứng viên nào nên ưu tiên phỏng vấn đầu cho ${jobTitle}?`,
        `Điểm yếu quan trọng nào cần lưu ý khi chọn ứng viên cho ${jobTitle}?`
      ];
    }

    const industryCount: Record<string, number> = {};
    for (const c of cands) {
      const ind = (c.industry || '').trim();
      if (!ind) continue;
      industryCount[ind] = (industryCount[ind] || 0) + 1;
    }
    let dominantIndustry = '';
    let max = 0;
    for (const [ind, cnt] of Object.entries(industryCount)) {
      if (cnt > max) { max = cnt; dominantIndustry = ind; }
    }

    const baseQuestions: string[] = [];
    if (dominantIndustry) {
      baseQuestions.push(
        `Ứng viên nào nổi bật nhất trong ngành ${dominantIndustry} cho vị trí ${jobTitle}?`,
        `Top 3 ứng viên ngành ${dominantIndustry} nên phỏng vấn đầu và lý do?`,
        `Những rủi ro quan trọng cần chú ý khi chọn ứng viên trong ngành ${dominantIndustry} cho ${jobTitle}?`
      );
    } else {
      baseQuestions.push(
        `Ứng viên nào phù hợp nhất với vị trí ${jobTitle}?`,
        `3 ứng viên nào nên ưu tiên phỏng vấn đầu cho ${jobTitle}?`,
        `Điểm yếu quan trọng nào cần lưu ý khi chọn ứng viên cho ${jobTitle}?`
      );
    }

    // Thêm câu hỏi về phỏng vấn
    baseQuestions.push(
      `Gợi ý 5 câu hỏi phỏng vấn chính cho vị trí ${jobTitle}?`,
      `Câu hỏi phỏng vấn nào để đánh giá kỹ năng cốt lõi của ${jobTitle}?`,
      `Tôi nên hỏi gì để phân biệt ứng viên giỏi và xuất sắc cho ${jobTitle}?`
    );

    // Trả về đúng 3 câu (ưu tiên mức độ quyết định: chọn ai -> shortlist -> rủi ro -> phỏng vấn)
    return baseQuestions.slice(0, 3);
  }, [analysisData]);

  const handleSuggestionClick = async (suggestion: string) => {
    setUserInput(suggestion);
    setShowSuggestions(false);
    // Auto submit
    const userMessage: ChatMessage = { id: Date.now().toString(), author: 'user', content: suggestion };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Check if query is about salary - enhance with real API data
      const salaryKeywords = ['lương', 'salary', 'mức lương', 'thu nhập', 'chi phí tuyển dụng', 'ngân sách'];
      const isSalaryQuery = salaryKeywords.some(keyword => 
        suggestion.toLowerCase().includes(keyword)
      );

      let responseText = '';
      let candidateIds: string[] = [];

      if (isSalaryQuery) {
        // Get AI response first
        const aiResponse = await getChatbotAdvice(analysisData, suggestion);
        responseText = aiResponse.responseText;
        candidateIds = aiResponse.candidateIds;

        // Try to get real salary data from API
        try {
          const salaryResult = await analyzeSalary({
            jobTitle: analysisData.job.position,
            location: analysisData.job.locationRequirement,
          });

          if (salaryResult.marketSalary) {
            const formatVND = (amount: number) => {
              if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
              if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} triệu`;
              return `${amount.toLocaleString('vi-VN')}`;
            };

            // Enhance response with real API data
            responseText += `\n\n📊 **Dữ liệu thị trường thực tế (từ job-salary-data API - RapidAPI):**\n`;
            responseText += `• P25 (Mức thấp): ${formatVND(salaryResult.marketSalary.p25)} VNĐ/tháng\n`;
            responseText += `• Median (Trung vị): ${formatVND(salaryResult.marketSalary.median)} VNĐ/tháng\n`;
            responseText += `• P75 (Mức cao): ${formatVND(salaryResult.marketSalary.p75)} VNĐ/tháng\n`;
            responseText += `\n💡 *Sử dụng tính năng "Phân Tích Mức Lương" để có phân tích chi tiết cho từng ứng viên cụ thể với gợi ý thương lượng.*`;
          }
        } catch (salaryError) {
          console.warn('Could not fetch salary data:', salaryError);
          // Continue with AI response only
        }
      } else {
        // Regular query - use AI only
        const aiResponse = await getChatbotAdvice(analysisData, suggestion);
        responseText = aiResponse.responseText;
        candidateIds = aiResponse.candidateIds;
      }

      const suggestedCandidates = analysisData.candidates.filter(c => candidateIds.includes(c.id));
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        author: 'bot',
        content: responseText,
        suggestedCandidates: suggestedCandidates.length > 0 ? suggestedCandidates.map(c => ({
          id: c.id,
          candidateName: c.candidateName,
          analysis: c.analysis,
        })) : undefined,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đã có lỗi xảy ra.';
      const botError: ChatMessage = {
        id: (Date.now() + 1).toString(),
        author: 'bot',
        content: `Rất tiếc, đã có lỗi: ${errorMessage}`,
      };
      setMessages(prev => [...prev, botError]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), author: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = userInput;
    setUserInput('');
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      // Check if query is about salary - enhance with real API data
      const salaryKeywords = ['lương', 'salary', 'mức lương', 'thu nhập', 'chi phí tuyển dụng', 'ngân sách'];
      const isSalaryQuery = salaryKeywords.some(keyword => 
        currentInput.toLowerCase().includes(keyword)
      );

      let responseText = '';
      let candidateIds: string[] = [];

      if (isSalaryQuery) {
        // Get AI response first
        const aiResponse = await getChatbotAdvice(analysisData, currentInput);
        responseText = aiResponse.responseText;
        candidateIds = aiResponse.candidateIds;

        // Try to get real salary data from API
        try {
          const salaryResult = await analyzeSalary({
            jobTitle: analysisData.job.position,
            location: analysisData.job.locationRequirement,
          });

          if (salaryResult.marketSalary) {
            const formatVND = (amount: number) => {
              if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
              if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} triệu`;
              return `${amount.toLocaleString('vi-VN')}`;
            };

            // Enhance response with real API data
            responseText += `\n\n📊 **Dữ liệu thị trường thực tế (từ job-salary-data API):**\n`;
            responseText += `• P25 (Mức thấp): ${formatVND(salaryResult.marketSalary.p25)} VNĐ/tháng\n`;
            responseText += `• Median (Trung vị): ${formatVND(salaryResult.marketSalary.median)} VNĐ/tháng\n`;
            responseText += `• P75 (Mức cao): ${formatVND(salaryResult.marketSalary.p75)} VNĐ/tháng\n`;
            responseText += `\n💡 *Sử dụng tính năng "Phân Tích Mức Lương" để có phân tích chi tiết cho từng ứng viên cụ thể.*`;
          }
        } catch (salaryError) {
          console.warn('Could not fetch salary data:', salaryError);
          // Continue with AI response only
        }
      } else {
        // Regular query - use AI only
        const aiResponse = await getChatbotAdvice(analysisData, currentInput);
        responseText = aiResponse.responseText;
        candidateIds = aiResponse.candidateIds;
      }

      const suggestedCandidates = analysisData.candidates.filter(c => candidateIds.includes(c.id));
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        author: 'bot',
        content: responseText,
        suggestedCandidates: suggestedCandidates.length > 0 ? suggestedCandidates.map(c => ({
          id: c.id,
          candidateName: c.candidateName,
          analysis: c.analysis,
        })) : undefined,
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đã có lỗi xảy ra.';
      const botError: ChatMessage = {
        id: (Date.now() + 1).toString(),
        author: 'bot',
        content: `Rất tiếc, đã có lỗi: ${errorMessage}`,
      };
      setMessages(prev => [...prev, botError]);
    } finally {
      setIsLoading(false);
    }
  };

  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isBot = message.author === 'bot';
    return (
      <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
        {isBot && (
          <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-robot text-sky-500"></i>
          </div>
        )}
        <div className={`max-w-xs md:max-w-sm lg:max-w-xs px-4 py-2.5 ${isBot ? 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-lg' : 'bg-sky-900/60 border border-sky-800 text-white rounded-lg'}`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
          {message.suggestedCandidates && (
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-400">Ứng viên liên quan:</p>
              {message.suggestedCandidates.map(c => (
                <div key={c.id} className="bg-slate-800/50 p-2 rounded-lg text-xs">
                  <p className="font-bold text-white">{c.candidateName}</p>
                  <p className="text-slate-300">Hạng: {c.analysis?.['Hạng']} - Điểm: {c.analysis?.['Tổng điểm']}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-2xl shadow-lg flex flex-col h-96 max-h-[70vh] z-50">
      <header className="p-4 border-b border-slate-800 bg-slate-900/50 flex-shrink-0 flex items-center justify-between rounded-t-2xl">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <i className="fa-solid fa-robot text-sky-500"></i>
          Trợ lý Tuyển dụng AI
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Đóng chatbot"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        )}
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        {isLoading && (
          <div className="flex justify-start gap-3">
             <div className="w-8 h-8 rounded-full border border-slate-600 bg-slate-700 flex items-center justify-center flex-shrink-0">
               <i className="fa-solid fa-robot text-sky-500"></i>
             </div>
             <div className="max-w-xs px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-0"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      <div className="p-3 border-t border-slate-800 flex-shrink-0 bg-slate-900/50 rounded-b-2xl">
        {showSuggestions && messages.length === 1 && (
          <div className="mb-3">
            <p className="text-xs text-slate-400 mb-2">Gợi ý câu hỏi:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full transition-colors border border-slate-700"
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            {/* Quick Interview Questions */}
            <p className="text-xs text-slate-400 mb-2">Câu hỏi phỏng vấn nhanh:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSuggestionClick(`Gợi ý 5 câu hỏi phỏng vấn chính cho vị trí ${analysisData.job.position}?`)}
                className="text-xs bg-purple-700 hover:bg-purple-600 text-purple-200 px-3 py-1.5 rounded-full transition-colors border border-purple-600"
                disabled={isLoading}
              >
                <i className="fa-solid fa-question-circle mr-1"></i>
                Câu hỏi chung
              </button>
              
              <button
                onClick={() => handleSuggestionClick(`Câu hỏi kỹ thuật nào phù hợp để đánh giá ứng viên ${analysisData.job.position}?`)}
                className="text-xs bg-green-700 hover:bg-green-600 text-green-200 px-3 py-1.5 rounded-full transition-colors border border-green-600"
                disabled={isLoading}
              >
                <i className="fa-solid fa-cogs mr-1"></i>
                Kỹ thuật
              </button>
              
              <button
                onClick={() => handleSuggestionClick(`Tôi nên hỏi gì để phân biệt ứng viên giỏi và xuất sắc cho ${analysisData.job.position}?`)}
                className="text-xs bg-orange-700 hover:bg-orange-600 text-orange-200 px-3 py-1.5 rounded-full transition-colors border border-orange-600"
                disabled={isLoading}
              >
                <i className="fa-solid fa-balance-scale mr-1"></i>
                Phân biệt
              </button>
            </div>

            {/* Salary Analysis Quick Actions */}
            <p className="text-xs text-slate-400 mb-2 mt-3">Phân tích mức lương:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSuggestionClick(`Mức lương thị trường cho vị trí ${analysisData.job.position} tại ${analysisData.job.locationRequirement || 'Việt Nam'} là bao nhiêu?`)}
                className="text-xs bg-green-700 hover:bg-green-600 text-green-200 px-3 py-1.5 rounded-full transition-colors border border-green-600"
                disabled={isLoading}
              >
                <i className="fa-solid fa-dollar-sign mr-1"></i>
                Lương thị trường
              </button>
              
              <button
                onClick={() => handleSuggestionClick(`Gợi ý mức lương hợp lý cho các ứng viên top theo kinh nghiệm?`)}
                className="text-xs bg-emerald-700 hover:bg-emerald-600 text-emerald-200 px-3 py-1.5 rounded-full transition-colors border border-emerald-600"
                disabled={isLoading}
              >
                <i className="fa-solid fa-chart-line mr-1"></i>
                Lương theo cấp độ
              </button>
              
              <button
                onClick={() => handleSuggestionClick(`Phân tích chi phí tuyển dụng cho vị trí ${analysisData.job.position}?`)}
                className="text-xs bg-teal-700 hover:bg-teal-600 text-teal-200 px-3 py-1.5 rounded-full transition-colors border border-teal-600"
                disabled={isLoading}
              >
                <i className="fa-solid fa-calculator mr-1"></i>
                Chi phí tuyển dụng
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Hỏi AI về ứng viên..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-600 transition-colors disabled:opacity-50"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !userInput.trim()} className="w-10 h-10 flex items-center justify-center bg-sky-700 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:bg-slate-800 disabled:cursor-not-allowed flex-shrink-0">
            {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotPanel;
