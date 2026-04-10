/**
 * WebAppShell — 主布局组件
 * 整合 PC 视图和移动端设备模拟器视图
 * 提供统一的切换界面和管理控制面板
 */
import React, { useState, useCallback } from 'react';
import { useWebAppSettings } from '../../context/WebAppSettingsContext';
import { useScreenSize, useMobileDetection } from '../../hooks/webAppHooks';
import { MobileSimulator } from './MobileSimulator';
import { PCView } from './PCView';
import { SettingsPanel } from '../settings/SettingsPanel';
import './WebAppShell.css';

interface WebAppShellProps {
  /** PC 模式下的内容 */
  pcContent: React.ReactNode;
  /** 移动端模拟器中的内容 */
  mobileContent: React.ReactNode;
  /** 工具栏（可选） */
  toolbar?: React.ReactNode;
  /** 侧边栏（可选，PC 模式专用） */
  sidebar?: React.ReactNode;
  /** 是否显示设置面板 */
  showSettings?: boolean;
  /** 是否显示切换按钮 */
  showToggleButton?: boolean;
  /** 是否显示设备信息 */
  showDeviceInfo?: boolean;
  /** 背景类名 */
  className?: string;
}

export const WebAppShell: React.FC<WebAppShellProps> = ({
  pcContent,
  mobileContent,
  toolbar,
  sidebar,
  showSettings = true,
  showToggleButton = true,
  showDeviceInfo = true,
  className = '',
}) => {
  const {
    viewMode,
    setViewMode,
    toggleViewMode,
    currentDevice,
    isMobileView,
  } = useWebAppSettings();

  const screen = useScreenSize();
  const mobile = useMobileDetection();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);

  const handleToggle = useCallback(() => {
    toggleViewMode();
  }, [toggleViewMode]);

  const handleSettings = useCallback(() => {
    setSettingsOpen(prev => !prev);
  }, []);

  // 设备信息显示
  const renderDeviceInfo = () => {
    if (!showDeviceInfo) return null;
    return (
      <div className="webapp-device-info">
        <div className="webapp-device-info__badge">
          <i className="fa-solid fa-mobile-screen" />
          <span>{currentDevice.name}</span>
        </div>
        <div className="webapp-device-info__size">
          {currentDevice.width} × {currentDevice.height}
        </div>
        {mobile.isMobile && (
          <div className="webapp-device-info__real">
            <span className="webapp-device-info__real-tag">真实移动设备</span>
          </div>
        )}
      </div>
    );
  };

  // 切换按钮
  const renderToggleButton = () => {
    if (!showToggleButton) return null;
    return (
      <button
        className="webapp-toggle-btn"
        onClick={handleToggle}
        title={isMobileView ? '切换到 PC 视图' : '切换到移动端视图'}
      >
        <div className="webapp-toggle-btn__track">
          <div className={`webapp-toggle-btn__thumb ${isMobileView ? 'webapp-toggle-btn__thumb--mobile' : 'webapp-toggle-btn__thumb--pc'}`}>
            <i className={`fa-solid ${isMobileView ? 'fa-mobile-screen-button' : 'fa-desktop'}`} />
          </div>
        </div>
        <span className="webapp-toggle-btn__label">
          {isMobileView ? '移动端' : 'PC'}
        </span>
      </button>
    );
  };

  // 快捷工具栏
  const renderToolbar = () => {
    if (!toolbar) return null;
    return (
      <div className="webapp-toolbar">
        {toolbar}
      </div>
    );
  };

  return (
    <div className={`webapp-shell ${isMobileView ? 'webapp-shell--mobile' : 'webapp-shell--pc'} ${className}`}>
      {/* 顶部控制栏 */}
      <header className="webapp-shell__header">
        <div className="webapp-shell__header-left">
          {renderToolbar()}
        </div>

        <div className="webapp-shell__header-center">
          {renderDeviceInfo()}
        </div>

        <div className="webapp-shell__header-right">
          {renderToggleButton()}

          {showSettings && (
            <button
              className={`webapp-settings-btn ${settingsOpen ? 'webapp-settings-btn--active' : ''}`}
              onClick={handleSettings}
              title="设置"
            >
              <i className="fa-solid fa-gear" />
            </button>
          )}
        </div>
      </header>

      {/* 设置面板 */}
      {settingsOpen && showSettings && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      )}

      {/* 主内容区域 */}
      <main className="webapp-shell__main">
        {isMobileView ? (
          <MobileSimulator>
            {mobileContent}
          </MobileSimulator>
        ) : (
          <div className="webapp-shell__pc-container">
            {sidebar && (
              <aside className="webapp-shell__sidebar">
                {sidebar}
              </aside>
            )}
            <div className="webapp-shell__pc-content">
              {pcContent}
            </div>
          </div>
        )}
      </main>

      {/* 移动端快捷控制栏 */}
      {isMobileView && (
        <div className="webapp-mobile-control-bar">
          <div className="webapp-mobile-control-bar__inner">
            <button
              className="webapp-mobile-control-bar__btn"
              onClick={handleToggle}
              title="切换到 PC 视图"
            >
              <i className="fa-solid fa-desktop" />
              <span>PC 视图</span>
            </button>
            <button
              className="webapp-mobile-control-bar__btn"
              onClick={() => setControlPanelOpen(prev => !prev)}
              title="设备控制"
            >
              <i className="fa-solid fa-sliders" />
              <span>设备</span>
            </button>
            <button
              className="webapp-mobile-control-bar__btn"
              onClick={handleSettings}
              title="设置"
            >
              <i className="fa-solid fa-gear" />
              <span>设置</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebAppShell;
