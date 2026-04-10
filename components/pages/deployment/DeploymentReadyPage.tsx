import React from 'react';

const DeploymentReadyPage: React.FC = () => {
  const socialLinks = [
    { name: 'Facebook', icon: 'fa-brands fa-facebook', url: 'https://www.facebook.com/profile.php?id=61577736765345&locale=vi_VN', color: 'text-blue-400', border: 'hover:border-blue-400/40 hover:text-blue-300' },
    { name: 'LinkedIn', icon: 'fa-brands fa-linkedin', url: 'https://www.linkedin.com/in/truong-minh-hoang-phuc-5ba70532b/', color: 'text-sky-400', border: 'hover:border-sky-400/40 hover:text-sky-300' },
    { name: 'GitHub', icon: 'fa-brands fa-github', url: 'https://github.com/orgs/TechFutureAIFPT/dashboard', color: 'text-slate-300', border: 'hover:border-slate-300/40 hover:text-white' },
    { name: 'Discord', icon: 'fa-brands fa-discord', url: 'https://discord.gg/supporthr', color: 'text-indigo-400', border: 'hover:border-indigo-400/40 hover:text-indigo-300' },
  ];

  return (
    <div className="min-h-screen bg-[#040814] flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1px),transparent 1px),linear-gradient(90deg,rgba(255,255,255,1px),transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-700/6 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-700/6 rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-8">
          <i className="fa-solid fa-rocket text-cyan-400 text-[10px]"></i>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Deployment Ready</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
          Sẵn sàng triển khai<br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">tại doanh nghiệp bạn</span>
        </h1>
        <p className="text-slate-400 text-base max-w-lg mx-auto mb-10 leading-relaxed">
          Liên hệ để nhận tài liệu triển khai, demo hệ thống và hỗ trợ đào tạo đội ngũ tuyển dụng.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="tel:0899280108"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:-translate-y-0.5 transition-all"
          >
            <i className="fa-solid fa-phone text-cyan-200"></i>
            Liên hệ ngay
          </a>
          <a
            href="mailto:support@supporthr.vn"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-[#0B1628] border border-slate-800/60 text-slate-300 font-semibold text-sm hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
          >
            <i className="fa-solid fa-envelope text-slate-400"></i>
            Gửi email
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-14">
          {[
            { value: '24/7', label: 'Hỗ trợ', icon: 'fa-headset', color: 'text-emerald-400' },
            { value: 'AI 95%+', label: 'Độ chính xác', icon: 'fa-brain', color: 'text-cyan-400' },
            { value: '< 5ph', label: 'Triển khai', icon: 'fa-bolt', color: 'text-amber-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#0B1628] rounded-2xl border border-slate-800/60 p-4">
              <i className={`fa-solid ${stat.icon} ${stat.color} text-base mb-2`}></i>
              <p className="text-sm font-black text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Social links */}
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-5">Kết nối với SupportHR</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-slate-800/60 bg-[#0B1628] ${social.color} ${social.border} transition-all duration-200`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <i className={`${social.icon} text-xl`}></i>
                </div>
                <span className="text-xs font-semibold">{social.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentReadyPage;
