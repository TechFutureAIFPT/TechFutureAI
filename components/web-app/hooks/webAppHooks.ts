/**
 * WebApp Hooks — 设备检测、响应式适配、断点管理等 Hooks
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebAppSettings, DEVICE_PRESETS, DeviceModel } from '../context/WebAppSettingsContext';

// ==================== 设备检测 ====================

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface ScreenInfo {
  width: number;
  height: number;
  size: ScreenSize;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  is3xl: boolean;
  aspectRatio: number;
  isLandscape: boolean;
  isPortrait: boolean;
  isRetina: boolean;
}

const getScreenSize = (w: number): ScreenSize => {
  if (w < 640) return 'xs';
  if (w < 768) return 'sm';
  if (w < 1024) return 'md';
  if (w < 1280) return 'lg';
  if (w < 1536) return 'xl';
  if (w < 1920) return '2xl';
  return '3xl';
};

export const useScreenSize = (): ScreenInfo => {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1920,
        height: 1080,
        size: '3xl' as ScreenSize,
        isXs: false, isSm: false, isMd: false, isLg: false, isXl: false, is2xl: false, is3xl: true,
        aspectRatio: 1920 / 1080,
        isLandscape: true, isPortrait: false, isRetina: false,
      };
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = getScreenSize(w);
    const dpr = window.devicePixelRatio || 1;
    return {
      width: w,
      height: h,
      size,
      isXs: size === 'xs', isSm: size === 'sm', isMd: size === 'md',
      isLg: size === 'lg', isXl: size === 'xl', is2xl: size === '2xl', is3xl: size === '3xl',
      aspectRatio: w / h,
      isLandscape: w > h, isPortrait: h >= w,
      isRetina: dpr >= 2,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const size = getScreenSize(w);
      const dpr = window.devicePixelRatio || 1;
      setScreenInfo({
        width: w, height: h, size,
        isXs: size === 'xs', isSm: size === 'sm', isMd: size === 'md',
        isLg: size === 'lg', isXl: size === 'xl', is2xl: size === '2xl', is3xl: size === '3xl',
        aspectRatio: w / h,
        isLandscape: w > h, isPortrait: h >= w,
        isRetina: dpr >= 2,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenInfo;
};

// ==================== 移动端检测 ====================

export interface MobileInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: string;
  deviceType: 'phone' | 'tablet' | 'desktop';
}

export const useMobileDetection = (): MobileInfo => {
  const [info, setInfo] = useState<MobileInfo>({
    isMobile: false, isTablet: false, isDesktop: true,
    isTouchDevice: false,
    os: 'unknown', browser: 'unknown', deviceType: 'desktop',
  });

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();

    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const isTablet = /ipad|tablet|playbook|silk/i.test(ua) && !/phone/i.test(ua);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    let os: MobileInfo['os'] = 'unknown';
    if (/iphone|ipad|ipod/i.test(ua)) os = 'ios';
    else if (/android/i.test(ua)) os = 'android';
    else if (/win/i.test(ua)) os = 'windows';
    else if (/mac/i.test(ua)) os = 'macos';
    else if (/linux/i.test(ua)) os = 'linux';

    let browser = 'unknown';
    if (/edg/i.test(ua)) browser = 'edge';
    else if (/chrome/i.test(ua)) browser = 'chrome';
    else if (/safari/i.test(ua)) browser = 'safari';
    else if (/firefox/i.test(ua)) browser = 'firefox';

    setInfo({
      isMobile, isTablet,
      isDesktop: !isMobile && !isTablet,
      isTouchDevice,
      os, browser,
      deviceType: isTablet ? 'tablet' : isMobile ? 'phone' : 'desktop',
    });
  }, []);

  return info;
};

// ==================== WebApp 设备预设 Hook ====================

export interface DeviceSelectorItem {
  id: DeviceModel;
  name: string;
  brand: string;
  width: number;
  height: number;
  icon: string;
  category: 'apple' | 'android' | 'custom';
  badge?: string;
}

export const useDeviceSelector = () => {
  const { currentDevice, setCurrentDeviceById } = useWebAppSettings();

  const devices: DeviceSelectorItem[] = [
    // Apple iPhone 系列
    {
      id: 'iphone-se',
      name: 'iPhone SE',
      brand: 'Apple',
      width: 375,
      height: 667,
      icon: 'fa-brands fa-apple',
      category: 'apple',
      badge: '经济型',
    },
    {
      id: 'iphone-14',
      name: 'iPhone 14',
      brand: 'Apple',
      width: 390,
      height: 844,
      icon: 'fa-brands fa-apple',
      category: 'apple',
    },
    {
      id: 'iphone-14-pro',
      name: 'iPhone 14 Pro',
      brand: 'Apple',
      width: 393,
      height: 852,
      icon: 'fa-brands fa-apple',
      category: 'apple',
    },
    {
      id: 'iphone-14-pro-max',
      name: 'iPhone 14 Pro Max',
      brand: 'Apple',
      width: 430,
      height: 932,
      icon: 'fa-brands fa-apple',
      category: 'apple',
    },
    {
      id: 'iphone-15',
      name: 'iPhone 15',
      brand: 'Apple',
      width: 393,
      height: 852,
      icon: 'fa-brands fa-apple',
      category: 'apple',
    },
    {
      id: 'iphone-15-pro',
      name: 'iPhone 15 Pro',
      brand: 'Apple',
      width: 393,
      height: 852,
      icon: 'fa-brands fa-apple',
      category: 'apple',
      badge: '推荐',
    },
    {
      id: 'iphone-15-pro-max',
      name: 'iPhone 15 Pro Max',
      brand: 'Apple',
      width: 430,
      height: 932,
      icon: 'fa-brands fa-apple',
      category: 'apple',
    },
    // Android 设备
    {
      id: 'samsung-s24',
      name: 'Samsung S24',
      brand: 'Samsung',
      width: 412,
      height: 915,
      icon: 'fa-solid fa-mobile-screen',
      category: 'android',
    },
    {
      id: 'pixel-8',
      name: 'Google Pixel 8',
      brand: 'Google',
      width: 412,
      height: 915,
      icon: 'fa-solid fa-mobile-android',
      category: 'android',
    },
    {
      id: 'xiaomi-14',
      name: 'Xiaomi 14',
      brand: 'Xiaomi',
      width: 393,
      height: 852,
      icon: 'fa-solid fa-mobile-android',
      category: 'android',
    },
    // 自定义
    {
      id: 'custom',
      name: '自定义尺寸',
      brand: 'Custom',
      width: 390,
      height: 844,
      icon: 'fa-solid fa-sliders',
      category: 'custom',
    },
  ];

  const groupedDevices = {
    apple: devices.filter(d => d.category === 'apple'),
    android: devices.filter(d => d.category === 'android'),
    custom: devices.filter(d => d.category === 'custom'),
  };

  return {
    devices,
    groupedDevices,
    currentDevice,
    selectDevice: setCurrentDeviceById,
  };
};

// ==================== 模拟器尺寸 Hook ====================

export const useSimulatorDimensions = () => {
  const { currentDevice, deviceOrientation, deviceScale, customWidth, customHeight } = useWebAppSettings();

  const effectiveWidth = deviceOrientation === 'portrait'
    ? currentDevice.width
    : currentDevice.height;
  const effectiveHeight = deviceOrientation === 'portrait'
    ? currentDevice.height
    : currentDevice.width;

  const containerWidth = effectiveWidth * deviceScale;
  const containerHeight = effectiveHeight * deviceScale;

  return {
    effectiveWidth,
    effectiveHeight,
    containerWidth: Math.round(containerWidth),
    containerHeight: Math.round(containerHeight),
    scale: deviceScale,
    orientation: deviceOrientation,
  };
};

// ==================== 防抖 Hook ====================

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// ==================== 节流 Hook ====================

export const useThrottle = <T>(value: T, interval: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= interval) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, interval - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, interval]);

  return throttledValue;
};

// ==================== 响应式条件渲染 Hook ====================

export const useResponsive = () => {
  const screen = useScreenSize();
  const mobile = useMobileDetection();

  const isBelow = (breakpoint: ScreenSize) => {
    const sizes: ScreenSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
    return sizes.indexOf(screen.size) < sizes.indexOf(breakpoint);
  };

  const isAbove = (breakpoint: ScreenSize) => {
    const sizes: ScreenSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
    return sizes.indexOf(screen.size) > sizes.indexOf(breakpoint);
  };

  return {
    ...screen,
    ...mobile,
    isBelow,
    isAbove,
  };
};

// ==================== 本地存储 Hook ====================

export const useLocalStorage = <T>(key: string, initialValue: T): [T, (v: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    setStoredValue(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key]);

  return [storedValue, setValue];
};
