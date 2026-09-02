import React, { useState } from 'react';

interface SplitzyLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showShadow?: boolean;
}

export const SplitzyLogo: React.FC<SplitzyLogoProps> = ({
  className = '',
  size = 'md',
  showShadow = true,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeMap: Record<string, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const dimension = typeof size === 'number' ? size : sizeMap[size] || 40;

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${
        showShadow ? 'drop-shadow-lg' : ''
      } ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {!imageError ? (
        <img
          src="/logo.png"
          alt="Apleq"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-2xl"
          onError={() => setImageError(true)}
        />
      ) : (
        /* Fallback icon if logo.png is not loaded yet */
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
          S
        </div>
      )}
    </div>
  );
};
