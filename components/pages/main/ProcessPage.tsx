import React from 'react';

interface ProcessPageProps {
  isIntroMode?: boolean;
  onStart?: () => void;
}

const PROCESS_STEPS = [
  {
    icon: 'fa-clipboard-list',
    title: 'Nhập Mô tả Công việc (JD)',
    description: 'Cung cấp JD chi tiết hoặc sử dụng OCR để AI hiểu rõ yêu cầu tuyển dụng.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/25',
    glowColor: 'shadow-cyan-500/10',
    step: '01',
  },
  {
    icon: 'fa-sliders',
    title: 'Đặt Tiêu chí & Trọng số',
    description: 'Thiết lập bộ lọc bắt buộc (địa điểm, kinh nghiệm) và phân bổ trọng số cho kỹ năng.',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/25',
    glowColor: 'shadow-violet-500/10',
    step: '02',
  },
  {
    icon: 'fa-file-arrow-up',
    title: 'Tải lên và Lọc CV',
    description: 'Tải lên hàng loạt CV. Hệ thống tự động lọc các CV không đạt yêu cầu bắt buộc.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/25',
    glowColor: 'shadow-emerald-500/10',
    step: '03',
  },
  {
    icon: 'fa-rocket',
    title: 'Phân tích & Chấm điểm AI',
    description: 'AI đọc hiểu, chấm điểm, xếp hạng từng CV dựa trên JD và trọng số đã thiết lập.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/25',
    glowColor: 'shadow-amber-500/10',
    step: '04',
  },
  {
    icon: 'fa-comments',
    title: 'Tư vấn & Lựa chọn',
    description: 'Sử dụng Dashboard và Chatbot AI để so sánh, nhận đề xuất và lựa chọn ứng viên tiềm năng nhất.',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/25',
    glowColor: 'shadow-pink-500/10',
    step: '05',
  },
  {
    icon: 'fa-file-csv',
    title: 'Xuất Danh sách & Phỏng vấn',
    description: 'Xuất danh sách ứng viên đã chọn ra file CSV để chia sẻ và bắt đầu quy trình phỏng vấn.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/25',
    glowColor: 'shadow-blue-500/10',
    step: '06',
  },
];

const ProcessPage: React.FC<ProcessPageProps> = ({ isIntroMode = false, onStart }) => {

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-5">
          <i className="fa-solid fa-route text-cyan-400 text-[10px]"></i>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Quy trình 6 bước</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Quy trình sàng lọc CV thông minh
        </h1>
        <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
          {isIntroMode
            ? 'Bắt đầu tối ưu hóa hiệu quả tuyển dụng của bạn với quy trình 6 bước toàn diện.'
            : 'Luồng làm việc được đề xuất để tối ưu hóa hiệu quả tuyển dụng của bạn.'}
        </p>
      </div>

      {/* ── Steps ──────────────────────────────────────────────── */}
      <div className="relative">
        {/* Connecting line (desktop) */}
        <div className="hidden md:block absolute left-[68px] top-10 bottom-10 w-px bg-slate-800/80" />

        <div className="space-y-6">
          {PROCESS_STEPS.map((step, index) => (
            <div key={index} className="flex items-center gap-0">
              {/* Left: content */}
              <div className="flex-1 flex justify-end pr-6">
                <div className={`bg-[#0B1628] border ${step.borderColor} rounded-2xl p-5 w-full max-w-md transition-all duration-300 hover:shadow-xl ${step.glowColor} group`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-base font-bold ${step.color}`}>{step.title}</h3>
                    <span className={`text-[10px] font-black ${step.color} opacity-60`}>{step.step}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>

              {/* Center: icon */}
              <div className="relative z-10 w-14 h-14 shrink-0 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full ${step.bgColor} border ${step.borderColor} animate-pulse`} style={{ animationDuration: '3s' }} />
                <div className={`relative w-11 h-11 rounded-full bg-[#040814] border ${step.borderColor} flex items-center justify-center shadow-lg`}>
                  <i className={`fa-solid ${step.icon} ${step.color} text-lg`}></i>
                </div>
              </div>

              {/* Right: spacer */}
              <div className="flex-1 pl-6" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {[
          { label: 'Thời gian', value: '< 5 phút', icon: 'fa-bolt', color: 'text-amber-400' },
          { label: 'Xử lý', value: 'Hàng loạt', icon: 'fa-infinity', color: 'text-cyan-400' },
          { label: 'Độ chính xác', value: 'AI 95%+', icon: 'fa-brain', color: 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0B1628] rounded-2xl border border-slate-800/60 p-4 text-center">
            <i className={`fa-solid ${stat.icon} ${stat.color} text-base mb-2`}></i>
            <p className="text-xs font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Start CTA ─────────────────────────────────────────── */}
      {!isIntroMode && (
        <div className="text-center">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all hover:-translate-y-0.5"
          >
            <i className="fa-solid fa-rocket text-base"></i>
            Bắt đầu sàng lọc ngay
          </button>
        </div>
      )}
    </div>
  );
};

export default ProcessPage;
