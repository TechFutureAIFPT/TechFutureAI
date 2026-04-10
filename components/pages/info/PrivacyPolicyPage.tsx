import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('roles');

  const sections = [
    { id: 'roles', title: 'Vai trò xử lý', icon: 'fa-sitemap', color: 'cyan' },
    { id: 'scope', title: 'Phạm vi dữ liệu', icon: 'fa-database', color: 'emerald' },
    { id: 'improvement', title: 'Cải thiện dữ liệu', icon: 'fa-chart-line', color: 'blue' },
    { id: 'security', title: 'Bảo mật & Lưu trữ', icon: 'fa-shield-halved', color: 'green' },
    { id: 'rights', title: 'Quyền chủ thể', icon: 'fa-user-shield', color: 'pink' },
  ];

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const colorMap: Record<string, { from: string; to: string; border: string; text: string; bg: string }> = {
    cyan: { from: 'from-cyan-500', to: 'to-blue-500', border: 'border-cyan-500/30', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    emerald: { from: 'from-emerald-500', to: 'to-teal-500', border: 'border-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    blue: { from: 'from-blue-500', to: 'to-indigo-500', border: 'border-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500/10' },
    green: { from: 'from-green-500', to: 'to-emerald-500', border: 'border-green-500/30', text: 'text-green-400', bg: 'bg-green-500/10' },
    pink: { from: 'from-pink-500', to: 'to-purple-500', border: 'border-pink-500/30', text: 'text-pink-400', bg: 'bg-pink-500/10' },
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'roles':
        return (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${colorMap.cyan.border} ${colorMap.cyan.bg} flex items-start gap-3 mb-3`}>
              <span className="text-xl mt-0.5">📋</span>
              <p className="text-slate-300 text-sm leading-relaxed">
                Để đảm bảo tính minh bạch theo <strong className="text-cyan-400">Nghị định 13/2023/NĐ-CP</strong>, SupportHR xác định rõ vai trò của các bên trong việc xử lý dữ liệu cá nhân.
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${colorMap.emerald.border} ${colorMap.emerald.bg}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-base">👤</div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-white text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Bên Kiểm soát</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">Khách hàng</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Quyết định mục đích và phương tiện xử lý dữ liệu cá nhân của ứng viên.
                  </p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${colorMap.blue.border} ${colorMap.blue.bg}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-base">⚙️</div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-white text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Bên Xử lý</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">SupportHR</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Thực hiện các hoạt động xử lý (thu thập, lưu trữ, phân tích) thay mặt cho Khách hàng và theo chỉ thị của Khách hàng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'scope':
        return (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm mb-1">Hệ thống thu thập và xử lý các loại dữ liệu sau để vận hành tính năng cốt lõi (Sàng lọc &amp; Chấm điểm):</p>

            <div className={`p-4 rounded-xl border ${colorMap.cyan.border} ${colorMap.cyan.bg}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-base">🏢</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm mb-2">Thông tin Tài khoản Doanh nghiệp</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Tên doanh nghiệp', 'Email liên hệ', 'Logo công ty', 'Mã số thuế'].map(item => (
                      <div key={item} className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${colorMap.emerald.border} ${colorMap.emerald.bg}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-base">📄</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm mb-2">Dữ liệu Ứng viên (Candidate Data)</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Họ tên, thông tin liên hệ', 'Lịch sử làm việc', 'Học vấn', 'Kỹ năng trong CV'].map(item => (
                      <div key={item} className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${colorMap.blue.border} ${colorMap.blue.bg}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-base">💼</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm mb-2">Dữ liệu Tuyển dụng</h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Nội dung JD', 'Tiêu chí đánh giá', 'Trọng số ưu tiên'].map(item => (
                      <div key={item} className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'improvement':
        return (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm mb-1">
              Khách hàng đồng ý cấp quyền cho SupportHR thực hiện các hoạt động sau đối với Dữ liệu Khách hàng:
            </p>
            <div className={`p-4 rounded-xl border ${colorMap.blue.border} ${colorMap.blue.bg}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-base">🔒</div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">Ẩn danh hóa (De-identification)</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Loại bỏ hoàn toàn các thông tin định danh cá nhân (PII) như Tên, Email, SĐT, Địa chỉ khỏi dữ liệu gốc.
                  </p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${colorMap.blue.border} ${colorMap.blue.bg}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 text-base">🤖</div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">Huấn luyện Mô hình</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Sử dụng dữ liệu đã được ẩn danh để huấn luyện lại (Re-train), tinh chỉnh (Fine-tune) thuật toán chấm điểm và cải thiện độ chính xác của AI.
                  </p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${colorMap.blue.border} ${colorMap.blue.bg}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 text-base">📊</div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">Thống kê</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Tạo các báo cáo thị trường lao động (Xu hướng kỹ năng, Mức lương trung bình) phục vụ cộng đồng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${colorMap.green.border} ${colorMap.green.bg}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🛡️</span>
                <h3 className="font-semibold text-white text-sm">Biện pháp an ninh</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🔐', title: 'Mã hóa đường truyền', desc: 'TLS 1.2+' },
                  { icon: '💾', title: 'Mã hóa tại chỗ', desc: 'AES-256' },
                  { icon: '🔑', title: 'Quản lý khóa API', desc: 'Server-side' },
                  { icon: '🚫', title: 'Ngăn chặn rò rỉ', desc: 'Anti-breach' },
                ].map(item => (
                  <div key={item.title} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-green-400 text-xs">{item.icon}</span>
                      <span className="font-medium text-white text-xs">{item.title}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${colorMap.green.border} ${colorMap.green.bg}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">⏱️</span>
                <h3 className="font-semibold text-white text-sm">Thời gian lưu trữ</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-2">
                Dữ liệu được lưu trữ trong suốt thời gian Khách hàng sử dụng Dịch vụ.
              </p>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-blue-200 text-xs leading-relaxed">
                  Khi Khách hàng chấm dứt hợp đồng hoặc gửi yêu cầu xóa tài khoản, SupportHR sẽ tiến hành <strong className="text-blue-400">xóa vĩnh viễn toàn bộ Dữ liệu Khách hàng</strong> trong vòng <strong className="text-blue-400">30 ngày</strong>, trừ khi pháp luật yêu cầu lưu trữ lâu hơn.
                </p>
              </div>
            </div>
          </div>
        );

      case 'rights':
        return (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${colorMap.pink.border} ${colorMap.pink.bg} flex items-start gap-3 mb-3`}>
              <span className="text-xl mt-0.5">⚖️</span>
              <p className="text-slate-300 text-sm leading-relaxed">
                SupportHR cam kết hỗ trợ Khách hàng thực hiện nghĩa vụ đối với chủ thể dữ liệu (ứng viên) theo quy định <strong className="text-pink-400">Nghị định 13/2023/NĐ-CP</strong>.
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${colorMap.cyan.border} ${colorMap.cyan.bg}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-base">📥</div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">Trích xuất dữ liệu</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Hỗ trợ trích xuất dữ liệu khi có yêu cầu từ ứng viên hoặc cơ quan có thẩm quyền.
                  </p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${colorMap.pink.border} ${colorMap.pink.bg}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 text-base">🗑️</div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">Quyền được lãng quên</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Hỗ trợ xóa bỏ hoàn toàn thông tin của một ứng viên cụ thể ra khỏi hệ thống khi ứng viên thực hiện "Quyền được lãng quên".
                  </p>
                </div>
              </div>
            </div>
            <div className={`p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10`}>
              <p className="text-indigo-200 text-xs leading-relaxed">
                ⚖️ Tất cả các quyền này được thực hiện theo quy định của <strong>Nghị định 13/2023/NĐ-CP</strong> về Bảo vệ dữ liệu cá nhân và các văn bản pháp luật có liên quan.
              </p>
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
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-600/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/6 rounded-full blur-3xl" />

      {/* Top nav */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl bg-[#0B1628] border border-slate-800/60 flex items-center justify-center overflow-hidden shadow-lg">
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-full h-full object-cover" />
          </Link>
          <div>
            <span className="text-white font-bold text-sm">SupportHR</span>
            <span className="text-slate-500 text-[11px] ml-2">Chính sách bảo mật</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/terms" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">Điều khoản sử dụng</Link>
          <Link to="/" className="w-8 h-8 rounded-lg bg-[#0B1628] border border-slate-800/60 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
            <i className="fa-solid fa-house text-[10px]" />
          </Link>
        </div>
      </div>

      {/* Page header */}
      <div className={`relative z-10 px-6 pt-8 pb-4 text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1628] border border-slate-800/60 flex items-center justify-center overflow-hidden shadow-xl shadow-black/30">
            <img src="/images/logos/logo.jpg" alt="SupportHR" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-3">
          <i className="fa-solid fa-shield-halved text-cyan-400 text-[9px]" />
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Legal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight">
          Chính sách bảo mật &amp; Xử lý dữ liệu
        </h1>
        <p className="text-slate-500 text-xs">
          Tuân thủ Nghị định 13/2023/NĐ-CP · Bảo vệ dữ liệu cá nhân
        </p>
      </div>

      {/* Layout */}
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
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
