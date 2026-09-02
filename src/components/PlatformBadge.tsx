import React from 'react';
import { useSharingPlatforms } from '../context/SharingPlatformsContext';
import { getSharingPlatformInfo } from '../utils/contrast';
import { Share2, Users, HeartHandshake, Globe } from 'lucide-react';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  if (!platform || !platform.trim()) {
    return null;
  }

  const { platforms } = useSharingPlatforms();
  const info = getSharingPlatformInfo(platform, platforms);

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 font-bold rounded-lg gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 font-bold rounded-xl gap-2',
  }[size];

  const getPlatformIcon = () => {
    const p = platform.toLowerCase();
    if (p.includes('directo') || p.includes('familia')) {
      return <HeartHandshake className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
    }
    if (p.includes('amigo')) {
      return <Users className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
    }
    if (p.includes('together') || p.includes('sharesub') || p.includes('sharingful') || p.includes('spliiit') || p.includes('gamsgo')) {
      return <Share2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
    }
    return <Globe className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
  };

  return (
    <span
      style={{
        backgroundColor: info.badgeBgColor,
        color: info.badgeTextColor,
        border: `1px solid ${info.badgeTextColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
      }}
      className={`inline-flex items-center tracking-tight transition-all duration-150 select-none shadow-xs ${sizeClasses} ${className}`}
      title={info.name}
    >
      {showIcon && getPlatformIcon()}
      <span className="truncate">{info.name}</span>
    </span>
  );
};

