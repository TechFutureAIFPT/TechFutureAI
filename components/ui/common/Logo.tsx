import React from 'react';

interface LogoProps {
  /**
   * Variant of the logo display
   * - 'full': Icon + text (default)
   * - 'icon': Icon only
   * - 'text': Text only
   */
  variant?: 'full' | 'icon' | 'text';

  /**
   * Size of the logo
   * - 'sm': Small (24px icon, 14px text)
   * - 'md': Medium (32px icon, 16px text) - default
   * - 'lg': Large (40px icon, 20px text)
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Click handler
   */
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  onClick
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      icon: 'w-6 h-6',
      text: 'text-sm',
      gap: 'gap-2'
    },
    md: {
      icon: 'w-8 h-8',
      text: 'text-base',
      gap: 'gap-2.5'
    },
    lg: {
      icon: 'w-10 h-10',
      text: 'text-lg',
      gap: 'gap-3'
    }
  };

  const config = sizeConfig[size];

  // Logo Icon Component
  const LogoIcon = () => (
    <div className={`${config.icon} rounded-lg overflow-hidden border border-white/10 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg`}>
      <img
        src="/images/logos/logo.jpg"
        alt="Support HR Logo"
        className="object-contain w-full h-full p-1"
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          // Ultimate fallback to text
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.innerHTML = '<span class="font-bold text-2xl text-white">S</span>';
          }
        }}
        draggable={false}
      />
    </div>
  );

  // Logo Text Component
  const LogoText = () => (
    <span
      className={`${config.text} font-bold tracking-wide bg-gradient-to-r from-blue-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent`}
    >
      Support HR
    </span>
  );

  // Main render
  const content = (
    <div
      className={`flex items-center ${config.gap} ${onClick ? 'cursor-pointer select-none' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {variant === 'icon' && <LogoIcon />}
      {variant === 'text' && <LogoText />}
      {variant === 'full' && (
        <>
          <LogoIcon />
          <LogoText />
        </>
      )}
    </div>
  );

  return content;
};

export default Logo;
