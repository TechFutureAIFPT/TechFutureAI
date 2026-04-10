/**
 * WebAppSettings Context — 统一管理 Web App 的视图模式和设备设置
 * 支持 PC 模拟模式和移动端真实模式
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/** 视图模式类型 */
export type ViewMode = 'pc' | 'mobile';

/** 设备类型 */
export type DeviceModel = 'iphone-14' | 'iphone-14-pro' | 'iphone-14-pro-max' | 'iphone-15' | 'iphone-15-pro' | 'iphone-15-pro-max' | 'iphone-se' | 'samsung-s24' | 'pixel-8' | 'xiaomi-14' | 'custom';

/** 设备预设信息 */
export interface DevicePreset {
  id: DeviceModel;
  name: string;
  brand: string;
  width: number;
  height: number;
  pixelRatio: number;
  diagonal: number;
  category: 'apple' | 'android' | 'custom';
  icon: string;
}

export const DEVICE_PRESETS: Record<DeviceModel, DevicePreset> = {
  'iphone-14': {
    id: 'iphone-14',
    name: 'iPhone 14',
    brand: 'Apple',
    width: 390,
    height: 844,
    pixelRatio: 2,
    diagonal: 6.1,
    category: 'apple',
    icon: 'fa-brands fa-apple',
  },
  'iphone-14-pro': {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    brand: 'Apple',
    width: 393,
    height: 852,
    pixelRatio: 3,
    diagonal: 6.1,
    category: 'apple',
    icon: 'fa-brands fa-apple',
  },
  'iphone-14-pro-max': {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    brand: 'Apple',
    width: 430,
    height: 932,
    pixelRatio: 3,
    diagonal: 6.7,
    category: 'apple',
    icon: 'fa-brands fa-apple',
  },
  'iphone-15': {
    id: 'iphone-15',
    name: 'iPhone 15',
    brand: 'Apple',
    width: 393,
    height: 852,
    pixelRatio: 2,
    diagonal: 6.1,
    category: 'apple',
    icon: 'fa-brands fa-apple',
  },
  'iphone-15-pro': {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    brand: 'Apple',
    width: 393,
    height: 852,
    pixelRatio: 3,
    diagonal: 6.1,
    category: 'apple',
    icon: 'fa-brands fa-apple',
  },
  'iphone-15-pro-max': {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    width: 430,
    height: 932,
    pixelRatio: 3,
    diagonal: 6.7,
    category: 'apple',
    icon: 'fa-brands fa-apple',
  },
  'iphone-se': {
    id: 'iphone-se',
    name: 'iPhone SE',
    brand: 'Apple',
    width: 375,
    height: 667,
    pixelRatio: 2,
    diagonal: 4.7,
    category: 'apple',
    icon: 'fa-brands fa-apple',
  },
  'samsung-s24': {
    id: 'samsung-s24',
    name: 'Samsung S24',
    brand: 'Samsung',
    width: 412,
    height: 915,
    pixelRatio: 2.625,
    diagonal: 6.2,
    category: 'android',
    icon: 'fa-solid fa-mobile-screen',
  },
  'pixel-8': {
    id: 'pixel-8',
    name: 'Google Pixel 8',
    brand: 'Google',
    width: 412,
    height: 915,
    pixelRatio: 2.625,
    diagonal: 6.2,
    category: 'android',
    icon: 'fa-solid fa-mobile-android',
  },
  'xiaomi-14': {
    id: 'xiaomi-14',
    name: 'Xiaomi 14',
    brand: 'Xiaomi',
    width: 393,
    height: 852,
    pixelRatio: 3,
    diagonal: 6.36,
    category: 'android',
    icon: 'fa-solid fa-mobile-android',
  },
  'custom': {
    id: 'custom',
    name: '自定义设备',
    brand: 'Custom',
    width: 390,
    height: 844,
    pixelRatio: 2,
    diagonal: 0,
    category: 'custom',
    icon: 'fa-solid fa-sliders',
  },
};

interface WebAppSettingsContextType {
  /** 当前视图模式 */
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;

  /** 当前设备预设 */
  currentDevice: DevicePreset;
  setCurrentDevice: (device: DevicePreset) => void;
  setCurrentDeviceById: (id: DeviceModel) => void;

  /** 自定义设备尺寸 */
  customWidth: number;
  customHeight: number;
  setCustomWidth: (w: number) => void;
  setCustomHeight: (h: number) => void;

  /** 设备模拟缩放 */
  deviceScale: number;
  setDeviceScale: (scale: number) => void;

  /** 设备模拟器是否全屏 */
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;

  /** 是否显示设备边框 */
  showDeviceFrame: boolean;
  setShowDeviceFrame: (v: boolean) => void;

  /** 是否显示缩放控制 */
  showZoomControl: boolean;
  setShowZoomControl: (v: boolean) => void;

  /** 是否锁定设备方向 */
  deviceOrientation: 'portrait' | 'landscape';
  setDeviceOrientation: (o: 'portrait' | 'landscape') => void;

  /** 切换为 PC 模式 */
  switchToPCMode: () => void;

  /** 切换为移动端模式 */
  switchToMobileMode: (deviceId?: DeviceModel) => void;

  /** 是否为移动端视图 */
  isMobileView: boolean;
}

const WebAppSettingsContext = createContext<WebAppSettingsContextType | null>(null);

const STORAGE_KEY_VIEW_MODE = 'webapp_view_mode';
const STORAGE_KEY_DEVICE = 'webapp_device';
const STORAGE_KEY_CUSTOM_W = 'webapp_custom_w';
const STORAGE_KEY_CUSTOM_H = 'webapp_custom_h';
const STORAGE_KEY_SCALE = 'webapp_scale';
const STORAGE_KEY_FRAME = 'webapp_frame';
const STORAGE_KEY_ORIENTATION = 'webapp_orientation';

export const WebAppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 视图模式
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
      return (saved === 'pc' || saved === 'mobile') ? saved : 'pc';
    }
    return 'pc';
  });

  // 设备预设
  const [currentDeviceId, setCurrentDeviceIdState] = useState<DeviceModel>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_DEVICE);
      if (saved && saved in DEVICE_PRESETS) return saved as DeviceModel;
    }
    return 'iphone-15-pro';
  });

  // 自定义尺寸
  const [customWidth, setCustomWidthState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_W);
      return saved ? parseInt(saved, 10) : 390;
    }
    return 390;
  });

  const [customHeight, setCustomHeightState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_H);
      return saved ? parseInt(saved, 10) : 844;
    }
    return 844;
  });

  // 缩放
  const [deviceScale, setDeviceScaleState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_SCALE);
      return saved ? parseFloat(saved) : 0.6;
    }
    return 0.6;
  });

  // 设备边框
  const [showDeviceFrame, setShowDeviceFrameState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_FRAME);
      return saved !== 'false';
    }
    return true;
  });

  // 方向
  const [deviceOrientation, setDeviceOrientationState] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_ORIENTATION);
      return saved === 'landscape' ? 'landscape' : 'portrait';
    }
    return 'portrait';
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showZoomControl] = useState(true);

  // 派生当前设备
  const currentDevice: DevicePreset =
    currentDeviceId === 'custom'
      ? { ...DEVICE_PRESETS['custom'], width: customWidth, height: customHeight }
      : DEVICE_PRESETS[currentDeviceId];

  // 设置方法
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY_VIEW_MODE, mode);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'pc' ? 'mobile' : 'pc');
  }, [viewMode, setViewMode]);

  const setCurrentDevice = useCallback((device: DevicePreset) => {
    const id = device.id;
    setCurrentDeviceIdState(id);
    localStorage.setItem(STORAGE_KEY_DEVICE, id);
    if (id === 'custom') {
      // 保持自定义尺寸
    } else {
      setCustomWidthState(device.width);
      setCustomHeightState(device.height);
    }
  }, []);

  const setCurrentDeviceById = useCallback((id: DeviceModel) => {
    setCurrentDeviceIdState(id);
    localStorage.setItem(STORAGE_KEY_DEVICE, id);
    if (id !== 'custom') {
      setCustomWidthState(DEVICE_PRESETS[id].width);
      setCustomHeightState(DEVICE_PRESETS[id].height);
    }
  }, []);

  const setCustomWidth = useCallback((w: number) => {
    setCustomWidthState(w);
    localStorage.setItem(STORAGE_KEY_CUSTOM_W, String(w));
  }, []);

  const setCustomHeight = useCallback((h: number) => {
    setCustomHeightState(h);
    localStorage.setItem(STORAGE_KEY_CUSTOM_H, String(h));
  }, []);

  const setDeviceScale = useCallback((scale: number) => {
    const clamped = Math.max(0.2, Math.min(1.5, scale));
    setDeviceScaleState(clamped);
    localStorage.setItem(STORAGE_KEY_SCALE, String(clamped));
  }, []);

  const setShowDeviceFrame = useCallback((v: boolean) => {
    setShowDeviceFrameState(v);
    localStorage.setItem(STORAGE_KEY_FRAME, String(v));
  }, []);

  const setDeviceOrientation = useCallback((o: 'portrait' | 'landscape') => {
    setDeviceOrientationState(o);
    localStorage.setItem(STORAGE_KEY_ORIENTATION, o);
  }, []);

  const switchToPCMode = useCallback(() => {
    setViewMode('pc');
  }, [setViewMode]);

  const switchToMobileMode = useCallback((deviceId: DeviceModel = 'iphone-15-pro') => {
    setViewMode('mobile');
    setCurrentDeviceById(deviceId);
  }, [setViewMode, setCurrentDeviceById]);

  const isMobileView = viewMode === 'mobile';

  // 在 PC 模式下自动调整缩放
  useEffect(() => {
    if (viewMode === 'pc') {
      setDeviceScaleState(1);
    }
  }, [viewMode]);

  return (
    <WebAppSettingsContext.Provider
      value={{
        viewMode,
        setViewMode,
        toggleViewMode,
        currentDevice,
        setCurrentDevice,
        setCurrentDeviceById,
        customWidth,
        customHeight,
        setCustomWidth,
        setCustomHeight,
        deviceScale,
        setDeviceScale,
        isFullscreen,
        setIsFullscreen,
        showDeviceFrame,
        setShowDeviceFrame,
        showZoomControl,
        setShowZoomControl: () => {},
        deviceOrientation,
        setDeviceOrientation,
        switchToPCMode,
        switchToMobileMode,
        isMobileView,
      }}
    >
      {children}
    </WebAppSettingsContext.Provider>
  );
};

export const useWebAppSettings = (): WebAppSettingsContextType => {
  const ctx = useContext(WebAppSettingsContext);
  if (!ctx) {
    throw new Error('useWebAppSettings must be used within WebAppSettingsProvider');
  }
  return ctx;
};
