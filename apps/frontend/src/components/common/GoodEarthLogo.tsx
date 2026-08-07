import React from 'react';

export interface GoodEarthLogoProps {
  className?: string;
  variant?: 'horizontal' | 'mark-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  lightText?: boolean;
  showTagline?: boolean;
}

export const GoodEarthLogo: React.FC<GoodEarthLogoProps> = ({
  className = '',
  size = 'md',
  lightText = false,
}) => {
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src="/goodearth-logo-hd.png"
        alt="GoodEarth - building sustainable communities"
        className={`${heightClasses[size]} w-auto object-contain transition-transform duration-200 ${lightText ? 'brightness-0 invert' : ''}`}
      />
    </div>
  );
};

export default GoodEarthLogo;
