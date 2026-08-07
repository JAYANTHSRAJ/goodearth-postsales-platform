import React from 'react';

interface GoodEarthLogoProps {
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'mark-only';
  lightText?: boolean;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GoodEarthLogo: React.FC<GoodEarthLogoProps> = ({
  className = '',
  variant = 'horizontal',
  lightText = false,
  showTagline = true,
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
  };

  const textPrimaryClass = lightText ? 'text-white' : 'text-[#0053a4] dark:text-white';
  const taglineClass = lightText ? 'text-brand-300' : 'text-[#706f70] dark:text-brand-300';

  // SVG Brandmark: Blue paint-brush circle (#0053a4) with 3 spiralling leaf-green strands (#a6be4b)
  const BrandmarkIcon = (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={iconSizes[size]}>
      {/* Outer Blue Swirl Base */}
      <circle cx="50" cy="50" r="38" stroke="#0053a4" strokeWidth="12" strokeDasharray="18 4 12 3" strokeLinecap="round" opacity="0.9" />
      <circle cx="50" cy="50" r="30" stroke="#00478c" strokeWidth="8" strokeDasharray="14 6 10 4" opacity="0.8" />
      
      {/* 3 Interlocking Leaf Green Spiralling Strands (#a6be4b) */}
      <path
        d="M 22,46 C 28,26 44,20 64,24 C 52,30 42,40 38,54 C 34,44 26,44 22,46 Z"
        fill="#a6be4b"
      />
      <path
        d="M 62,26 C 76,38 78,56 70,74 C 66,60 56,52 40,52 C 48,44 52,34 62,26 Z"
        fill="#a6be4b"
      />
      <path
        d="M 68,72 C 50,82 32,76 22,60 C 32,62 44,56 50,42 C 54,54 60,64 68,72 Z"
        fill="#a6be4b"
      />
      {/* Inner Soft Center Void */}
      <circle cx="50" cy="50" r="16" fill="transparent" />
    </svg>
  );

  if (variant === 'mark-only') {
    return <div className={`inline-flex items-center ${className}`}>{BrandmarkIcon}</div>;
  }

  if (variant === 'vertical') {
    return (
      <div className={`inline-flex flex-col items-center text-center gap-1.5 ${className}`}>
        {BrandmarkIcon}
        <div className="flex flex-col items-center">
          <span className={`font-sans text-xl font-bold tracking-tight ${textPrimaryClass}`}>
            GoodEarth
          </span>
          {showTagline && (
            <span className={`font-sans text-[10px] font-medium tracking-wide uppercase ${taglineClass}`}>
              building sustainable communities
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {BrandmarkIcon}
      <div className="flex flex-col text-left leading-none">
        <span className={`font-sans text-xl font-extrabold tracking-tight ${textPrimaryClass}`}>
          GoodEarth
        </span>
        {showTagline && (
          <span className={`font-sans text-[10px] font-semibold tracking-normal mt-0.5 ${taglineClass}`}>
            building sustainable communities
          </span>
        )}
      </div>
    </div>
  );
};

export default GoodEarthLogo;
