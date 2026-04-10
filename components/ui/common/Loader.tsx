/**
 * Loader — Chỉ hỗ trợ Dark Mode
 */
import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex justify-center items-center flex-col gap-6 text-center py-12 md:py-16">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 rounded-full border-blue-500/20" />
        <div className="absolute inset-0 border-t-4 rounded-full animate-spin border-blue-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full pulse-animation bg-blue-500/20" />
        </div>
      </div>
      <div>
        <p className="font-semibold text-lg text-slate-300">
          {message || 'Đang phân tích CV với AI...'}
        </p>
        <p className="text-sm mt-2 text-slate-500">
          Quá trình này có thể mất một chút thời gian để đảm bảo độ chính xác cao nhất.
        </p>
      </div>
    </div>
  );
};

export default Loader;
