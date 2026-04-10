/**
 * PCView — PC 桌面视图组件
 * 提供标准桌面端的展示模式
 */
import React from 'react';
import { useScreenSize } from '../../hooks/webAppHooks';
import './PCView.css';

interface PCViewProps {
  children: React.ReactNode;
  /** 最大宽度 */
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 是否居中 */
  centered?: boolean;
  /** 是否使用深色/浅色主题 */
  theme?: 'auto' | 'dark' | 'light';
  /** 自定义类名 */
  className?: string;
}

export const PCView: React.FC<PCViewProps> = ({
  children,
  maxWidth = 'xl',
  centered = false,
  theme = 'auto',
  className = '',
}) => {
  const screen = useScreenSize();

  const maxWidthClass = {
    none: '',
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-[80rem]',
  };

  return (
    <div className={`pc-view ${centered ? 'pc-view--centered' : ''} ${className}`}>
      <div
        className={`pc-view__container ${maxWidthClass[maxWidth]}`}
        style={{
          minHeight: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PCView;
