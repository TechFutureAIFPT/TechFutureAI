/**
 * WebAppDemo — Web App 演示主页
 * 展示 PC/Mobile 模式切换功能的完整演示
 */
import React from 'react';
import { WebAppShell } from './components/layout/WebAppShell';
import { MobileAppView } from './components/pages/MobileAppView';
import { PCAppView } from './components/pages/PCAppView';
import './styles/webapp-demo.css';

export const WebAppDemo: React.FC = () => {
  return (
    <div className="webapp-demo">
      <WebAppShell
        showSettings={true}
        showToggleButton={true}
        showDeviceInfo={true}
        pcContent={<PCAppView />}
        mobileContent={<MobileAppView />}
        toolbar={
          <div className="webapp-demo__toolbar">
            <button className="webapp-demo__toolbar-btn">
              <i className="fa-solid fa-bars" />
            </button>
            <span className="webapp-demo__toolbar-title">候选人筛选系统</span>
          </div>
        }
      />
    </div>
  );
};

export default WebAppDemo;
