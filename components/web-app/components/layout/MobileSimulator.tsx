/**
 * MobileSimulator — 移动端设备模拟器组件
 * 在 PC 浏览器中模拟各种手机设备的显示效果
 * 支持 iPhone、Android 等多种设备边框和 UI
 */
import React, { useState, useCallback } from 'react';
import { useWebAppSettings } from '../../context/WebAppSettingsContext';
import { useSimulatorDimensions } from '../../hooks/webAppHooks';
import './MobileSimulator.css';

interface MobileSimulatorProps {
  children: React.ReactNode;
  /** 是否显示状态栏 */
  showStatusBar?: boolean;
  /** 是否显示导航栏 */
  showNavBar?: boolean;
  /** 自定义类名 */
  className?: string;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  children,
  showStatusBar = true,
  showNavBar = true,
  className = '',
}) => {
  const {
    currentDevice,
    showDeviceFrame,
    deviceScale,
    setDeviceScale,
    deviceOrientation,
    setDeviceOrientation,
    isFullscreen,
    setIsFullscreen,
  } = useWebAppSettings();

  const { containerWidth, containerHeight, scale } = useSimulatorDimensions();
  const [isDragging, setIsDragging] = useState(false);

  const isIPhone = currentDevice.category === 'apple';
  const isSamsung = currentDevice.id === 'samsung-s24';
  const isNotch = isIPhone && ['iphone-14-pro', 'iphone-14-pro-max', 'iphone-15-pro', 'iphone-15-pro-max'].includes(currentDevice.id);

  const handleZoomIn = useCallback(() => {
    setDeviceScale(deviceScale + 0.1);
  }, [deviceScale, setDeviceScale]);

  const handleZoomOut = useCallback(() => {
    setDeviceScale(deviceScale - 0.1);
  }, [deviceScale, setDeviceScale]);

  const handleRotate = useCallback(() => {
    setDeviceOrientation(deviceOrientation === 'portrait' ? 'landscape' : 'portrait');
  }, [deviceOrientation, setDeviceOrientation]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen, setIsFullscreen]);

  const handleResetZoom = useCallback(() => {
    setDeviceScale(0.6);
  }, [setDeviceScale]);

  const effectiveWidth = deviceOrientation === 'portrait' ? currentDevice.width : currentDevice.height;
  const effectiveHeight = deviceOrientation === 'portrait' ? currentDevice.height : currentDevice.width;

  return (
    <div className={`mobile-simulator ${isFullscreen ? 'mobile-simulator--fullscreen' : ''} ${className}`}>
      {/* 缩放控制栏 */}
      <div className="mobile-simulator__controls">
        <div className="mobile-simulator__controls-left">
          <button
            className="mobile-simulator__ctrl-btn"
            onClick={handleZoomOut}
            disabled={deviceScale <= 0.2}
            title="缩小"
          >
            <i className="fa-solid fa-minus" />
          </button>

          <div className="mobile-simulator__zoom-display">
            <span>{Math.round(deviceScale * 100)}%</span>
          </div>

          <button
            className="mobile-simulator__ctrl-btn"
            onClick={handleZoomIn}
            disabled={deviceScale >= 1.5}
            title="放大"
          >
            <i className="fa-solid fa-plus" />
          </button>

          <button
            className="mobile-simulator__ctrl-btn mobile-simulator__ctrl-btn--secondary"
            onClick={handleResetZoom}
            title="重置缩放"
          >
            <i className="fa-solid fa-arrows-rotate" />
          </button>
        </div>

        <div className="mobile-simulator__controls-right">
          <button
            className="mobile-simulator__ctrl-btn mobile-simulator__ctrl-btn--secondary"
            onClick={handleRotate}
            title="旋转设备"
          >
            <i className="fa-solid fa-rotate-right" />
          </button>

          <button
            className={`mobile-simulator__ctrl-btn ${isFullscreen ? 'mobile-simulator__ctrl-btn--active' : ''}`}
            onClick={handleFullscreen}
            title={isFullscreen ? '退出全屏' : '全屏模拟'}
          >
            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
          </button>
        </div>
      </div>

      {/* 设备框架 */}
      <div className="mobile-simulator__stage">
        <div
          className={`mobile-simulator__device ${showDeviceFrame ? 'mobile-simulator__device--framed' : 'mobile-simulator__device--frameless'} mobile-simulator__device--${currentDevice.id}`}
          style={{
            width: containerWidth,
            height: containerHeight,
          }}
        >
          {/* iPhone 刘海/灵动岛 */}
          {showDeviceFrame && isNotch && (
            <div className="mobile-simulator__notch">
              <div className="mobile-simulator__notch-inner">
                <div className="mobile-simulator__camera" />
              </div>
            </div>
          )}

          {/* 状态栏 */}
          {showStatusBar && showDeviceFrame && (
            <div className={`mobile-simulator__status-bar ${isIPhone ? 'mobile-simulator__status-bar--ios' : 'mobile-simulator__status-bar--android'}`}>
              <div className="mobile-simulator__status-bar__left">
                <span className="mobile-simulator__status-bar__time">9:41</span>
              </div>
              <div className="mobile-simulator__status-bar__right">
                <i className="fa-solid fa-signal" />
                <i className="fa-solid fa-wifi" />
                <div className="mobile-simulator__status-bar__battery">
                  <span>100%</span>
                  <i className="fa-solid fa-battery-full" />
                </div>
              </div>
            </div>
          )}

          {/* 内容区域 */}
          <div
            className="mobile-simulator__screen"
            style={{
              width: effectiveWidth,
              height: effectiveHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>

          {/* Home Indicator (iPhone) */}
          {showDeviceFrame && isIPhone && (
            <div className="mobile-simulator__home-indicator" />
          )}

          {/* 底部导航条 (Android) */}
          {showDeviceFrame && !isIPhone && (
            <div className="mobile-simulator__android-nav">
              <div className="mobile-simulator__android-nav-btn mobile-simulator__android-nav-btn--back">
                <i className="fa-solid fa-caret-left" />
              </div>
              <div className="mobile-simulator__android-nav-btn mobile-simulator__android-nav-btn--home">
                <div className="mobile-simulator__android-nav-circle" />
              </div>
              <div className="mobile-simulator__android-nav-btn mobile-simulator__android-nav-btn--tasks">
                <i className="fa-solid fa-bars" />
              </div>
            </div>
          )}

          {/* Samsung 额头 */}
          {showDeviceFrame && isSamsung && (
            <div className="mobile-simulator__samsung-camera">
              <div className="mobile-simulator__samsung-camera-lens" />
            </div>
          )}
        </div>
      </div>

      {/* 设备信息 */}
      <div className="mobile-simulator__info">
        <span className="mobile-simulator__info-brand">{currentDevice.brand}</span>
        <span className="mobile-simulator__info-name">{currentDevice.name}</span>
        <span className="mobile-simulator__info-resolution">{effectiveWidth} × {effectiveHeight}px</span>
        {deviceOrientation !== 'portrait' && (
          <span className="mobile-simulator__info-orientation">
            <i className="fa-solid fa-rotate-right" /> {deviceOrientation}
          </span>
        )}
      </div>
    </div>
  );
};

export default MobileSimulator;
