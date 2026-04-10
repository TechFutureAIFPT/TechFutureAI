import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TermsPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('definitions');

  const sections = [
    { id: 'definitions', title: 'Định nghĩa', icon: 'fa-book', color: 'cyan' },
    { id: 'intellectual-property', title: 'Sở hữu trí tuệ', icon: 'fa-lightbulb', color: 'emerald' },
    { id: 'ai-disclaimer', title: 'AI & Miễn trừ', icon: 'fa-robot', color: 'violet' },
    { id: 'responsibility', title: 'Trách nhiệm', icon: 'fa-scale-balanced', color: 'blue' },
    { id: 'limitation', title: 'Giới hạn', icon: 'fa-ban', color: 'orange' },
    { id: 'sla-bcp', title: 'SLA & BCP', icon: 'fa-server', color: 'purple' },
  ];

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const colorMap: Record<string, { from: string; to: string; border: string; text: string; bg: string }> = {
    cyan: { from: 'from-cyan-500', to: 'to-blue-500', border: 'border-cyan-500/30', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    emerald: { from: 'from-emerald-500', to: 'to-teal-500', border: 'border-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    violet: { from: 'from-violet-500', to: 'to-purple-500', border: 'border-violet-500/30', text: 'text-violet-400', bg: 'bg-violet-500/10' },
    blue: { from: 'from-blue-500', to: 'to-indigo-500', border: 'border-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500/10' },
    orange: { from: 'from-orange-500', to: 'to-amber-500', border: 'border-orange-500/30', text: 'text-orange-400', bg: 'bg-orange-500/10' },
    purple: { from: 'from-purple-500', to: 'to-pink-500', border: 'border-purple-500/30', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  };

  const renderSectionContent = () => {
    const colors = colorMap[sections.find(s => s.id === activeSection)?.color ?? 'cyan'];

    switch (activeSection) {
      case 'definitions':
        return (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                <span className={`font-semibold text-sm ${colors.text}`}>Dịch vụ (Service)</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pl-4">
                Nền tảng phần mềm SupportHR bao gồm mọi tính năng liên quan như chuẩn hóa JD, trích xuất OCR, chấm điểm AI, API, giao diện người dùng.
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                <span className={`font-semibold text-sm ${colors.text}`}>Khách hàng (Customer)</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pl-4">
                Cá nhân hoặc tổ chức đăng ký tài khoản và sử dụng Dịch vụ.
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                <span className={`font-semibold text-sm ${colors.text}`}>Dữ liệu Khách hàng (Customer Data)</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pl-4">
                Mọi thông tin, văn bản (JD, CV), hình ảnh hoặc tài liệu mà Khách hàng tải lên, nhập vào hoặc gửi qua Dịch vụ.
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                <span className={`font-semibold text-sm ${colors.text}`}>Đầu ra AI (AI Output)</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pl-4">
                Dữ liệu, văn bản, bảng điểm, xếp hạng hoặc nội dung được tạo ra bởi Dịch vụ thông qua xử lý Dữ liệu Khách hàng bằng các mô hình trí tuệ nhân tạo.
              </p>
            </div>
          </div>
        );

      case 'intellectual-property':
        return (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">2.1</span>
                <span className="font-semibold text-white text-sm">Quyền sở hữu của Khách hàng</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Khách hàng giữ toàn quyền sở hữu, quyền tác giả và quyền lợi đối với Dữ liệu Khách hàng. SupportHR không yêu cầu bất kỳ quyền sở hữu nào đối với các tài liệu tuyển dụng hoặc hồ sơ ứng viên.
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">2.2</span>
                <span className="font-semibold text-white text-sm">Quyền sở hữu của SupportHR</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-2">
                SupportHR sở hữu độc quyền mọi quyền đối với Dịch vụ, bao gồm:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['Mã nguồn, giao diện', 'Thuật toán WSM', 'Quy trình xử lý 2 lớp', 'Tài liệu kỹ thuật'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-slate-400 text-xs">
                    <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30">2.3</span>
                <span className="font-semibold text-white text-sm">Cấp phép sử dụng dữ liệu</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Khách hàng cấp cho SupportHR giấy phép <strong className="text-white">toàn cầu, không độc quyền, miễn phí bản quyền</strong> để truy cập, sao chép, lưu trữ và xử lý Dữ liệu Khách hàng duy nhất cho mục đích cung cấp Dịch vụ.
              </p>
            </div>
          </div>
        );

      case 'ai-disclaimer':
        return (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg} flex items-start gap-3`}>
              <span className="text-xl mt-0.5">🤖</span>
              <p className="text-slate-300 text-sm leading-relaxed">
                Dịch vụ tích hợp các mô hình ngôn ngữ lớn (LLM) từ bên thứ ba (Google Gemini). Do tính chất xác suất và phát sinh của công nghệ này, Khách hàng đồng ý với các điều khoản sau:
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-500/30">3.1</span>
                <span className="font-semibold text-white text-sm">Tính chính xác (Accuracy)</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-2">
                Các tính năng AI có thể tạo ra kết quả không chính xác, sai lệch hoặc không đầy đủ (<strong className="text-amber-400">Ảo giác AI</strong>).
              </p>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-amber-200 text-xs leading-relaxed">
                  ⚠️ SupportHR <strong>không cam kết, bảo đảm</strong> rằng Đầu ra AI là chính xác hoặc phù hợp cho bất kỳ mục đích cụ thể nào. Khách hàng có trách nhiệm độc lập trong việc xác minh mọi Đầu ra AI.
                </p>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold border border-green-500/30">3.2</span>
                <span className="font-semibold text-white text-sm">Không thay thế con người (Human-in-the-loop)</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Dịch vụ là <strong className="text-green-400">công cụ hỗ trợ ra quyết định</strong> (Decision Support System), không phải hệ thống ra quyết định tự động. Khách hàng cam kết duy trì sự giám sát của con người trong toàn bộ quy trình tuyển dụng.
              </p>
            </div>
          </div>
        );

      case 'responsibility':
        return (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">4.1</span>
                <span className="font-semibold text-white text-sm">Tuân thủ Luật Lao động</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                Khách hàng chịu trách nhiệm đảm bảo việc sử dụng Dịch vụ tuân thủ nghiêm ngặt:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <span className="text-blue-400 text-sm">📜</span>
                  <span className="text-blue-200 text-xs">Bộ luật Lao động VN</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <span className="text-blue-400 text-sm">⚖️</span>
                  <span className="text-blue-200 text-xs">Chống phân biệt đối xử</span>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold border border-red-500/30">4.2</span>
                <span className="font-semibold text-white text-sm">Dữ liệu cấm</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-2">
                Khách hàng cam kết <strong className="text-red-400">KHÔNG</strong> tải lên Dịch vụ các dữ liệu sau:
              </p>
              <div className="space-y-1.5">
                {[
                  'Dữ liệu thuộc danh mục bí mật nhà nước',
                  'Dữ liệu vi phạm thuần phong mỹ tục',
                  'Phần mềm độc hại, virus, mã nguồn tấn công',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-slate-400 text-xs">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 text-[10px]">✗</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'limitation':
        return (
          <div className="space-y-3">
            <div className={`p-3 rounded-xl border ${colors.border} ${colors.bg} text-center`}>
              <p className={`font-bold text-xs ${colors.text} uppercase tracking-wider`}>
                Trong phạm vi tối đa pháp luật cho phép:
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0 border border-orange-500/30">A</span>
                <div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    SupportHR <strong className="text-orange-400">SẼ KHÔNG CHỊU TRÁCH NHIỆM</strong> về bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, hậu quả hoặc trừng phạt nào.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Mất lợi nhuận', 'Mất dữ liệu', 'Gián đoạn kinh doanh'].map(item => (
                      <span key={item} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/50">{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-500/30">B</span>
                <div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Tổng trách nhiệm pháp lý của SupportHR đối với bất kỳ khiếu nại nào <strong className="text-amber-400">SẼ KHÔNG VƯỢT QUÁ</strong> số tiền Khách hàng đã thanh toán trong vòng:
                  </p>
                  <div className="mt-3 text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <span className="text-2xl font-black text-amber-400">03</span>
                    <span className="text-amber-200 text-sm ml-1">(BA) THÁNG</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">trước khi sự kiện dẫn đến khiếu nại xảy ra</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sla-bcp':
        return (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold border border-green-500/30">6.1</span>
                <span className="font-semibold text-white text-sm">Tính sẵn sàng hệ thống (Uptime)</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs">Mục tiêu SLA:</span>
                <span className="text-2xl font-black text-green-400">99.0%</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                SupportHR cam kết nỗ lực hợp lý về mặt thương mại để duy trì Dịch vụ hoạt động ổn định. Các trường hợp gián đoạn do bảo trì định kỳ, sự cố bất khả kháng hoặc lỗi từ nhà cung cấp hạ tầng nằm ngoài phạm vi kiểm soát của chúng tôi.
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30">6.2</span>
                <span className="font-semibold text-white text-sm">Kế hoạch dự phòng đối tác (Vendor Continuity)</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-2">
                Hệ thống được xây dựng trên kiến trúc linh hoạt, giảm thiểu sự phụ thuộc độc quyền vào một nhà cung cấp duy nhất.
              </p>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-start gap-2">
                  <span className={`${colors.text} mt-0.5`}>📢</span>
                  <p className="text-purple-200 text-xs leading-relaxed">
                    Thông báo cho Khách hàng <strong>trước ít nhất 30 ngày</strong> (trừ trường hợp khẩn cấp).
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">🔄</span>
                  <p className="text-indigo-200 text-xs leading-relaxed">
                    Nỗ lực kỹ thuật để chuyển đổi sang các giải pháp thay thế tương đương (ví dụ: Gemini → OpenAI).
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1px),transparent 1px),linear-gradient(90deg,rgba(255,255,255,1px),transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyan-600/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-violet-600/6 rounded-full blur-3xl" />

      {/* Top nav */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl bg-[#0B1628] border border-slate-800/60 flex items-center justify-center overflow-hidden shadow-lg">
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-full h-full object-cover" />
          </Link>
          <div>
            <span className="text-white font-bold text-sm">SupportHR</span>
            <span className="text-slate-500 text-[11px] ml-2">Điều khoản sử dụng</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/privacy-policy" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">Chính sách bảo mật</Link>
          <Link to="/" className="w-8 h-8 rounded-lg bg-[#0B1628] border border-slate-800/60 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
            <i className="fa-solid fa-house text-[10px]" />
          </Link>
        </div>
      </div>

      {/* Page header */}
      <div className={`relative z-10 px-6 pt-8 pb-4 text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-3">
          <i className="fa-solid fa-file-contract text-cyan-400 text-[9px]" />
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Legal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight">
          Điều khoản sử dụng dịch vụ
        </h1>
        <p className="text-slate-500 text-xs">
          Phiên bản chính thức · Có hiệu lực: 06/01/2026
        </p>
      </div>

      {/* Layout: sidebar + content */}
      <div className={`relative z-10 px-4 sm:px-6 pb-10 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="max-w-5xl mx-auto flex gap-4">

          {/* Sidebar */}
          <div className="hidden md:flex flex-col gap-1.5 w-52 shrink-0">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 pb-1">Mục lục</p>
            {sections.map((section) => {
              const isActive = section.id === activeSection;
              const colors = colorMap[section.color];
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${colors.from}/10 to-transparent border ${colors.border}`
                      : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                    isActive
                      ? `bg-gradient-to-br ${colors.from} ${colors.to} text-white shadow-lg`
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    <i className={`fa-solid ${section.icon} text-[9px]`} />
                  </div>
                  <span className={`text-xs font-medium leading-tight ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {section.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile stepper */}
          <div className="md:hidden w-full mb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {sections.map((section) => {
                const isActive = section.id === activeSection;
                const colors = colorMap[section.color];
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${colors.from}/15 border ${colors.border} ${colors.text}`
                        : 'bg-slate-800/60 border border-slate-700/50 text-slate-500'
                    }`}
                  >
                    <i className={`fa-solid ${section.icon} text-[9px]`} />
                    {section.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-[#0B1628]/80 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
              {/* Section title */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                  colorMap[sections.find(s => s.id === activeSection)?.color ?? 'cyan'].from
                } ${
                  colorMap[sections.find(s => s.id === activeSection)?.color ?? 'cyan'].to
                } flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                  {sections.findIndex(s => s.id === activeSection) + 1}
                </div>
                <h2 className="text-lg font-bold text-white">
                  {sections.find(s => s.id === activeSection)?.title}
                </h2>
              </div>
              {/* Content */}
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
