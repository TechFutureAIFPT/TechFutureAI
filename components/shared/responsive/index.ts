// Main responsive layout
export { default as ResponsiveLayout } from './desktop/DesktopLayout';
export { default as TabletLayout } from './tablet/TabletLayout';
export { default as MobileLayout } from './mobile/MobileLayout';

// Hooks and utilities
export { useDeviceDetection, useBreakpoint, breakpoints } from './useDeviceDetection';
export type { DeviceType } from './useDeviceDetection';