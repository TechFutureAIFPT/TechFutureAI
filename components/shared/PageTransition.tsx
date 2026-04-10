import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface StepInfo {
  message: string;
  icon: string;
  accent: string;
}

const PageTransition: React.FC = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [progress, setProgress] = useState(0);

  const getStepInfo = (path: string): StepInfo => {
    switch (path) {
      case '/jd':
        return { message: 'Khởi tạo trình lọc CV thông minh...', icon: 'fa-wand-magic-sparkles', accent: 'from-violet-500 to-indigo-500' };
      case '/weights':
        return { message: 'Đã lưu mô tả! Thiết lập tiêu chí đánh giá...', icon: 'fa-sliders', accent: 'from-indigo-500 to-blue-500' };
      case '/upload':
        return { message: 'Sẵn sàng! Chuyển sang bước nạp hồ sơ...', icon: 'fa-cloud-arrow-up', accent: 'from-cyan-500 to-blue-500' };
      case '/analysis':
        return { message: 'Khởi động AI! Bắt đầu phân tích CV...', icon: 'fa-chart-line', accent: 'from-emerald-500 to-cyan-500' };
      case '/detailed-analytics':
        return { message: 'Tổng hợp báo cáo chi tiết...', icon: 'fa-chart-bar', accent: 'from-blue-500 to-violet-500' };
      case '/chatbot':
        return { message: 'Kết nối với Trợ lý AI...', icon: 'fa-robot', accent: 'from-purple-500 to-pink-500' };
      case '/':
        return { message: 'Chuẩn bị trang chủ...', icon: 'fa-home', accent: 'from-slate-500 to-slate-600' };
      default:
        return { message: 'Đang tối ưu trải nghiệm...', icon: 'fa-sparkles', accent: 'from-indigo-500 to-cyan-500' };
    }
  };

  const stepInfo = getStepInfo(location.pathname);

  useEffect(() => {
    setProgress(0);
    setIsTransitioning(true);
    setShouldRender(true);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(progressTimer); return 90; }
        return prev + Math.random() * 15;
      });
    }, 100);

    const transitionTimer = setTimeout(() => {
      setIsTransitioning(false);
      setProgress(100);
      setTimeout(() => setShouldRender(false), 300);
    }, 400);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(transitionTimer);
    };
  }, [location.pathname]);

  if (!shouldRender) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        transition-all duration-300
        ${isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        bg-[#0B1120]
      `}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-24 h-24">
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stepInfo.accent} blur-xl opacity-30 animate-pulse`} />
          <div className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br ${stepInfo.accent} shadow-xl flex items-center justify-center`}>
            <i className={`fa-solid ${stepInfo.icon} text-white text-3xl animate-pulse`} />
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-slate-300 text-sm font-medium tracking-wide animate-pulse">
            {stepInfo.message}
          </p>
          <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${stepInfo.accent} rounded-full transition-all duration-150 ease-out`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageTransition;
