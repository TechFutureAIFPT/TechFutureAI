/**
 * SettingsPanel — 设置面板组件
 * 提供设备选择、视图模式切换、缩放控制等完整设置界面
 */
import React, { useState, useCallback } from 'react';
import { useWebAppSettings, DEVICE_PRESETS, DeviceModel } from '../../context/WebAppSettingsContext';
import { useDeviceSelector } from '../../hooks/webAppHooks';
import './SettingsPanel.css';

interface SettingsPanelProps {
  onClose?: () => void;
}

type SettingsTab = 'device' | 'view' | 'display' | 'about';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const {
    viewMode,
    setViewMode,
    currentDevice,
    setCurrentDeviceById,
    customWidth,
    customHeight,
    setCustomWidth,
    setCustomHeight,
    deviceScale,
    setDeviceScale,
    showDeviceFrame,
    setShowDeviceFrame,
    deviceOrientation,
    setDeviceOrientation,
    isFullscreen,
    setIsFullscreen,
  } = useWebAppSettings();

  const { devices, groupedDevices } = useDeviceSelector();
  const [activeTab, setActiveTab] = useState<SettingsTab>('device');
  const [customWidthInput, setCustomWidthInput] = useState(String(customWidth));
  const [customHeightInput, setCustomHeightInput] = useState(String(customHeight));
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevices = searchQuery
    ? devices.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : devices;

  const handleDeviceSelect = useCallback((id: DeviceModel) => {
    setCurrentDeviceById(id);
  }, [setCurrentDeviceById]);

  const handleCustomWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomWidthInput(e.target.value);
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0 && val <= 2000) {
      setCustomWidth(val);
    }
  }, [setCustomWidth]);

  const handleCustomHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomHeightInput(e.target.value);
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0 && val <= 4000) {
      setCustomHeight(val);
    }
  }, [setCustomHeight]);

  const handleScaleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDeviceScale(parseFloat(e.target.value));
  }, [setDeviceScale]);

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen, setIsFullscreen]);

  const renderDeviceCard = (device: typeof devices[0]) => {
    const isSelected = currentDevice.id === device.id;
    return (
      <button
        key={device.id}
        className={`device-card ${isSelected ? 'device-card--selected' : ''}`}
        onClick={() => handleDeviceSelect(device.id)}
      >
        <div className="device-card__icon">
          <i className={device.icon} />
        </div>
        <div className="device-card__info">
          <span className="device-card__name">{device.name}</span>
          <span className="device-card__resolution">{device.width}×{device.height}</span>
        </div>
        {device.badge && (
          <span className="device-card__badge">{device.badge}</span>
        )}
        {isSelected && (
          <div className="device-card__check">
            <i className="fa-solid fa-check" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="settings-panel">
      <div className="settings-panel__header">
        <h3 className="settings-panel__title">
          <i className="fa-solid fa-sliders" />
          设置
        </h3>
        <button className="settings-panel__close" onClick={onClose}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {/* 标签页 */}
      <div className="settings-panel__tabs">
        <button
          className={`settings-panel__tab ${activeTab === 'device' ? 'settings-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('device')}
        >
          <i className="fa-solid fa-mobile-screen-button" />
          设备
        </button>
        <button
          className={`settings-panel__tab ${activeTab === 'view' ? 'settings-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          <i className="fa-solid fa-eye" />
          视图
        </button>
        <button
          className={`settings-panel__tab ${activeTab === 'display' ? 'settings-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('display')}
        >
          <i className="fa-solid fa-palette" />
          显示
        </button>
        <button
          className={`settings-panel__tab ${activeTab === 'about' ? 'settings-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <i className="fa-solid fa-circle-info" />
          关于
        </button>
      </div>

      <div className="settings-panel__content">
        {/* ======== 设备选项卡 ======== */}
        {activeTab === 'device' && (
          <div className="settings-panel__tab-content">
            {/* 视图模式切换 */}
            <div className="settings-section">
              <h4 className="settings-section__title">视图模式</h4>
              <div className="view-mode-switcher">
                <button
                  className={`view-mode-btn ${viewMode === 'pc' ? 'view-mode-btn--active' : ''}`}
                  onClick={() => setViewMode('pc')}
                >
                  <i className="fa-solid fa-desktop" />
                  <span>PC 视图</span>
                </button>
                <button
                  className={`view-mode-btn ${viewMode === 'mobile' ? 'view-mode-btn--active' : ''}`}
                  onClick={() => setViewMode('mobile')}
                >
                  <i className="fa-solid fa-mobile-screen-button" />
                  <span>移动端</span>
                </button>
              </div>
            </div>

            {/* 搜索设备 */}
            <div className="settings-section">
              <h4 className="settings-section__title">选择设备</h4>
              <div className="device-search">
                <i className="fa-solid fa-search" />
                <input
                  type="text"
                  placeholder="搜索设备..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Apple 设备 */}
            {!searchQuery && (
              <div className="settings-section">
                <h4 className="settings-section__title">
                  <i className="fa-brands fa-apple" /> Apple
                </h4>
                <div className="device-grid">
                  {groupedDevices.apple.map(renderDeviceCard)}
                </div>
              </div>
            )}

            {/* Android 设备 */}
            {!searchQuery && (
              <div className="settings-section">
                <h4 className="settings-section__title">
                  <i className="fa-solid fa-robot" /> Android
                </h4>
                <div className="device-grid">
                  {groupedDevices.android.map(renderDeviceCard)}
                </div>
              </div>
            )}

            {/* 搜索结果 */}
            {searchQuery && (
              <div className="settings-section">
                <h4 className="settings-section__title">搜索结果 ({filteredDevices.length})</h4>
                <div className="device-grid">
                  {filteredDevices.map(renderDeviceCard)}
                </div>
              </div>
            )}

            {/* 自定义尺寸 */}
            <div className="settings-section">
              <h4 className="settings-section__title">自定义尺寸</h4>
              <div className="custom-size-inputs">
                <div className="custom-size-input">
                  <label>宽度 (px)</label>
                  <input
                    type="number"
                    min="200"
                    max="2000"
                    value={customWidthInput}
                    onChange={handleCustomWidthChange}
                  />
                </div>
                <div className="custom-size-separator">×</div>
                <div className="custom-size-input">
                  <label>高度 (px)</label>
                  <input
                    type="number"
                    min="300"
                    max="4000"
                    value={customHeightInput}
                    onChange={handleCustomHeightChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======== 视图选项卡 ======== */}
        {activeTab === 'view' && (
          <div className="settings-panel__tab-content">
            {/* 方向控制 */}
            <div className="settings-section">
              <h4 className="settings-section__title">设备方向</h4>
              <div className="orientation-switcher">
                <button
                  className={`orientation-btn ${deviceOrientation === 'portrait' ? 'orientation-btn--active' : ''}`}
                  onClick={() => setDeviceOrientation('portrait')}
                >
                  <i className="fa-solid fa-mobile-screen" />
                  <span>竖屏</span>
                </button>
                <button
                  className={`orientation-btn ${deviceOrientation === 'landscape' ? 'orientation-btn--active' : ''}`}
                  onClick={() => setDeviceOrientation('landscape')}
                >
                  <i className="fa-solid fa-mobile-screen" style={{ transform: 'rotate(90deg)' }} />
                  <span>横屏</span>
                </button>
              </div>
            </div>

            {/* 缩放控制 */}
            <div className="settings-section">
              <h4 className="settings-section__title">模拟器缩放</h4>
              <div className="zoom-control">
                <div className="zoom-control__labels">
                  <span>20%</span>
                  <span className="zoom-control__value">{Math.round(deviceScale * 100)}%</span>
                  <span>150%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={deviceScale}
                  onChange={handleScaleSlider}
                  className="zoom-slider"
                />
                <div className="zoom-control__presets">
                  {[0.4, 0.5, 0.6, 0.75, 1.0].map(v => (
                    <button
                      key={v}
                      className={`zoom-preset-btn ${Math.abs(deviceScale - v) < 0.01 ? 'zoom-preset-btn--active' : ''}`}
                      onClick={() => setDeviceScale(v)}
                    >
                      {Math.round(v * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 全屏模式 */}
            <div className="settings-section">
              <h4 className="settings-section__title">模拟器模式</h4>
              <div className="toggle-row">
                <div className="toggle-row__info">
                  <span className="toggle-row__label">全屏模拟</span>
                  <span className="toggle-row__desc">设备模拟器覆盖整个窗口</span>
                </div>
                <button
                  className={`toggle-switch ${isFullscreen ? 'toggle-switch--on' : ''}`}
                  onClick={handleFullscreenToggle}
                >
                  <div className="toggle-switch__thumb" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======== 显示选项卡 ======== */}
        {activeTab === 'display' && (
          <div className="settings-panel__tab-content">
            {/* 设备边框 */}
            <div className="settings-section">
              <h4 className="settings-section__title">外观</h4>
              <div className="toggle-row">
                <div className="toggle-row__info">
                  <span className="toggle-row__label">显示设备边框</span>
                  <span className="toggle-row__desc">显示手机边框、按钮和刘海</span>
                </div>
                <button
                  className={`toggle-switch ${showDeviceFrame ? 'toggle-switch--on' : ''}`}
                  onClick={() => setShowDeviceFrame(!showDeviceFrame)}
                >
                  <div className="toggle-switch__thumb" />
                </button>
              </div>
            </div>

            {/* 快捷预设 */}
            <div className="settings-section">
              <h4 className="settings-section__title">快速预设</h4>
              <div className="preset-buttons">
                <button
                  className="preset-btn"
                  onClick={() => {
                    setViewMode('mobile');
                    setCurrentDeviceById('iphone-15-pro');
                    setDeviceScale(0.6);
                    setShowDeviceFrame(true);
                  }}
                >
                  <i className="fa-brands fa-apple" />
                  iPhone 最佳
                </button>
                <button
                  className="preset-btn"
                  onClick={() => {
                    setViewMode('mobile');
                    setCurrentDeviceById('samsung-s24');
                    setDeviceScale(0.6);
                    setShowDeviceFrame(true);
                  }}
                >
                  <i className="fa-solid fa-mobile-screen" />
                  Android 最佳
                </button>
                <button
                  className="preset-btn"
                  onClick={() => {
                    setViewMode('pc');
                  }}
                >
                  <i className="fa-solid fa-desktop" />
                  PC 视图
                </button>
              </div>
            </div>

            {/* 当前设备信息 */}
            <div className="settings-section">
              <h4 className="settings-section__title">当前设备信息</h4>
              <div className="device-info-grid">
                <div className="device-info-item">
                  <span className="device-info-item__label">设备</span>
                  <span className="device-info-item__value">{currentDevice.name}</span>
                </div>
                <div className="device-info-item">
                  <span className="device-info-item__label">品牌</span>
                  <span className="device-info-item__value">{currentDevice.brand}</span>
                </div>
                <div className="device-info-item">
                  <span className="device-info-item__label">分辨率</span>
                  <span className="device-info-item__value">{currentDevice.width} × {currentDevice.height}px</span>
                </div>
                <div className="device-info-item">
                  <span className="device-info-item__label">方向</span>
                  <span className="device-info-item__value">{deviceOrientation === 'portrait' ? '竖屏' : '横屏'}</span>
                </div>
                <div className="device-info-item">
                  <span className="device-info-item__label">DPR</span>
                  <span className="device-info-item__value">{currentDevice.pixelRatio}×</span>
                </div>
                <div className="device-info-item">
                  <span className="device-info-item__label">缩放</span>
                  <span className="device-info-item__value">{Math.round(deviceScale * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======== 关于选项卡 ======== */}
        {activeTab === 'about' && (
          <div className="settings-panel__tab-content">
            <div className="settings-section">
              <h4 className="settings-section__title">关于 Web App Simulator</h4>
              <div className="about-content">
                <div className="about-logo">
                  <i className="fa-solid fa-mobile-screen-button" />
                </div>
                <h3 className="about-name">Responsive Web App</h3>
                <p className="about-version">版本 1.0.0</p>
                <p className="about-desc">
                  响应式 Web 应用测试工具，支持多设备预览、PC/Mobile 模式切换。
                </p>
              </div>
            </div>

            <div className="settings-section">
              <h4 className="settings-section__title">支持的品牌</h4>
              <div className="about-brands">
                <div className="about-brand">
                  <i className="fa-brands fa-apple" />
                  <span>Apple</span>
                  <small>6 款设备</small>
                </div>
                <div className="about-brand">
                  <i className="fa-solid fa-mobile-screen" />
                  <span>Samsung</span>
                  <small>1 款设备</small>
                </div>
                <div className="about-brand">
                  <i className="fa-solid fa-robot" />
                  <span>Google</span>
                  <small>1 款设备</small>
                </div>
                <div className="about-brand">
                  <i className="fa-solid fa-mobile-android" />
                  <span>Xiaomi</span>
                  <small>1 款设备</small>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4 className="settings-section__title">功能特性</h4>
              <ul className="about-features">
                <li><i className="fa-solid fa-check" /> 支持 11 种预设设备</li>
                <li><i className="fa-solid fa-check" /> 自定义设备尺寸</li>
                <li><i className="fa-solid fa-check" /> PC / 移动端模式切换</li>
                <li><i className="fa-solid fa-check" /> 设备旋转（横竖屏）</li>
                <li><i className="fa-solid fa-check" /> 缩放控制</li>
                <li><i className="fa-solid fa-check" /> 设备边框显示/隐藏</li>
                <li><i className="fa-solid fa-check" /> 全屏模拟模式</li>
                <li><i className="fa-solid fa-check" /> 响应式预览</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
