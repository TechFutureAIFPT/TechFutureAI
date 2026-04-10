import React from 'react';

const AchievementsContactPage: React.FC = () => {
  const achievements = [
    { src: '/photo/trophie/Khuyến Khích Tin Học Trẻ.jpg', alt: 'Khuyến Khích Tin Học Trẻ' },
    { src: '/photo/trophie/sáng tạo thanh thiếu niên.jpg', alt: 'Sáng tạo Thanh Thiếu Niên' },
    { src: '/photo/trophie/tmhp.png', alt: 'TMHP' },
  ];

  const contactImage = '/photo/contact/contact top cv.jpg';

  return (
    <div className="min-h-screen bg-[#040814]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-4">
            <i className="fa-solid fa-trophy text-cyan-400 text-[10px]"></i>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Awards & Contact</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">Thành tích & Liên hệ</h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">Các giải thưởng đạt được và thông tin liên hệ hỗ trợ</p>
        </div>

        {/* ── Achievements ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <i className="fa-solid fa-trophy text-amber-400 text-xs"></i>
            </div>
            <h2 className="text-xl font-bold text-white">Giải thưởng</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {achievements.map((item, index) => (
              <div key={index} className="bg-[#0B1628] rounded-2xl border border-slate-800/60 overflow-hidden group hover:border-amber-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-900/10">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 bg-[#0B1628]">
                  <h3 className="text-sm font-bold text-white text-center">{item.alt}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <i className="fa-solid fa-envelope text-cyan-400 text-xs"></i>
            </div>
            <h2 className="text-xl font-bold text-white">Liên hệ</h2>
          </div>
          <div className="bg-[#0B1628] rounded-2xl border border-slate-800/60 overflow-hidden">
            <div className="aspect-[3/2] sm:aspect-[4/1] overflow-hidden">
              <img
                src={contactImage}
                alt="Contact Information"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 bg-[#0B1628]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: 'fa-phone', label: 'Điện thoại', value: '0899 280 108', color: 'text-emerald-400', border: 'hover:border-emerald-500/30' },
                  { icon: 'fa-envelope', label: 'Email', value: 'support@supporthr.vn', color: 'text-cyan-400', border: 'hover:border-cyan-500/30' },
                  { icon: 'fa-github', label: 'GitHub', value: 'phucdevweb', color: 'text-slate-300', border: 'hover:border-slate-500/30' },
                ].map(item => (
                  <a key={item.label} href="#"
                    className={`flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 ${item.border} transition-all duration-200 group`}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center flex-shrink-0`}>
                      <i className={`fa-solid ${item.icon} ${item.color} text-sm`}></i>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{item.label}</p>
                      <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">{item.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AchievementsContactPage;
