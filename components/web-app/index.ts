/**
 * WebApp 组件库索引导出
 *
 * 使用方法:
 * import { WebAppDemo, WebAppShell, MobileSimulator } from '@/components/web-app';
 */

// 导出所有组件
export { WebAppDemo } from './WebAppDemo';
export { WebAppShell } from './components/layout/WebAppShell';
export { MobileSimulator } from './components/layout/MobileSimulator';
export { PCView } from './components/layout/PCView';
export { SettingsPanel } from './components/settings/SettingsPanel';
export { MobileAppView } from './components/pages/MobileAppView';
export { PCAppView } from './components/pages/PCAppView';

// 导出 Context
export {
  WebAppSettingsProvider,
  useWebAppSettings,
  DEVICE_PRESETS,
  type ViewMode,
  type DeviceModel,
  type DevicePreset,
} from './context/WebAppSettingsContext';

// 导出 Hooks
export {
  useScreenSize,
  useMobileDetection,
  useDeviceSelector,
  useSimulatorDimensions,
  useDebounce,
  useThrottle,
  useResponsive,
  useLocalStorage,
  type ScreenInfo,
  type MobileInfo,
  type DeviceSelectorItem,
  type ScreenSize,
} from './hooks/webAppHooks';
