/**
 * MobileLayout — Chỉ hỗ trợ Dark Mode
 */
import React, { useState } from 'react';
import Navbar from '../../../layout/Navbar';
import Sidebar from '../../../layout/Sidebar';
import type { AppStep } from '../../../../assets/types';

interface MobileLayoutProps {
  children?: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<AppStep>('home');
  const [completedSteps, setCompletedSteps] = useState<AppStep[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');

  const handleReset = () => { setActiveStep('home'); setCompletedSteps([]); };
  const handleLogout = () => { setUserEmail(''); setActiveStep('home'); setCompletedSteps([]); };
  const handleLoginRequest = () => {};
  const handleBrandClick = () => { setActiveStep('home'); setSidebarOpen(false); };
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar overlay */}
      <div className={`
        fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:hidden
      `}>
        <div className="flex h-full">
          <div className="w-64 bg-[#0B1120] border-slate-800">
            <Sidebar
              activeStep={activeStep} setActiveStep={setActiveStep}
              completedSteps={completedSteps} onReset={handleReset}
              onLogout={handleLogout} userEmail={userEmail}
              onLoginRequest={handleLoginRequest}
              isOpen={sidebarOpen} onClose={closeSidebar}
            />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={closeSidebar} />
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className="sticky top-0 z-30 border-b bg-slate-900/95 border-slate-700 backdrop-blur-lg mobile-nav">
        <Navbar
          userEmail={userEmail} onLogout={handleLogout}
          onLoginRequest={handleLoginRequest} onBrandClick={handleBrandClick}
          sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar}
          sidebarCollapsed={false}
        />
      </div>

      {/* Mobile Main Content */}
      <div className="mobile-main">
        <main className="min-h-screen p-4 pb-20">
          <div className="max-w-full">{children}</div>
        </main>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-slate-900/95 border-slate-700 backdrop-blur-lg mobile-bottom-nav">
        <div className="flex justify-around items-center h-16 px-2">
          {[
            { step: 'home' as AppStep, icon: 'fa-home', label: 'Trang chủ' },
            { step: 'jd' as AppStep, icon: 'fa-file-text', label: 'Công việc' },
            { step: 'upload' as AppStep, icon: 'fa-upload', label: 'Tải CV' },
            { step: 'analysis' as AppStep, icon: 'fa-chart-line', label: 'Phân tích' },
          ].map(({ step, icon, label }) => (
            <button
              key={step}
              onClick={() => setActiveStep(step)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full rounded-lg
                transition-colors
                ${activeStep === step
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }
              `}
            >
              <i className={`fas ${icon} text-lg mb-1`} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}

          <button
            onClick={toggleSidebar}
            className="flex flex-col items-center justify-center flex-1 h-full rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <i className="fas fa-bars text-lg mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileLayout;
