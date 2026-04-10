import React, { useState, useEffect } from 'react';

interface SyncNotificationProps {
  show: boolean;
  onClose: () => void;
  syncType: 'avatar' | 'history' | 'profile';
  success: boolean;
  message?: string;
}

const SyncNotification: React.FC<SyncNotificationProps> = ({ 
  show, 
  onClose, 
  syncType, 
  success, 
  message 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !isVisible) return null;

  const getIcon = () => {
    switch (syncType) {
      case 'avatar':
        return 'fa-camera';
      case 'history':
        return 'fa-history';
      case 'profile':
        return 'fa-user-circle';
      default:
        return 'fa-sync';
    }
  };

  const getTitle = () => {
    switch (syncType) {
      case 'avatar':
        return 'Đồng bộ Avatar';
      case 'history':
        return 'Đồng bộ Lịch sử';
      case 'profile':
        return 'Đồng bộ Hồ sơ';
      default:
        return 'Đồng bộ dữ liệu';
    }
  };

  const defaultMessage = success 
    ? `${getTitle()} thành công! Dữ liệu đã được lưu vào tài khoản Gmail của bạn.`
    : `Không thể ${getTitle().toLowerCase()}. Đã lưu vào bộ nhớ cục bộ.`;

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
      isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
    }`}>
      <div className={`min-w-80 max-w-md p-4 rounded-xl border backdrop-blur-lg shadow-2xl ${
        success 
          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50' 
          : 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-400/50'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            success ? 'bg-green-500/20' : 'bg-orange-500/20'
          }`}>
            <i className={`fa-solid ${success ? 'fa-check' : 'fa-exclamation-triangle'} text-sm ${
              success ? 'text-green-400' : 'text-orange-400'
            }`}></i>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <i className={`fa-solid ${getIcon()} text-sm ${
                success ? 'text-green-400' : 'text-orange-400'
              }`}></i>
              <h4 className={`font-semibold text-sm ${
                success ? 'text-green-200' : 'text-orange-200'
              }`}>
                {getTitle()}
              </h4>
            </div>
            <p className={`text-xs leading-relaxed ${
              success ? 'text-green-300/80' : 'text-orange-300/80'
            }`}>
              {message || defaultMessage}
            </p>
          </div>

          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className={`w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0 ${
              success ? 'text-green-400 hover:text-green-300' : 'text-orange-400 hover:text-orange-300'
            }`}
          >
            <i className="fa-solid fa-times text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncNotification;