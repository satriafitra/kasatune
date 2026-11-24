import React from 'react';

export interface KasatuneLogoIconProps {
  size?: number | string;
  className?: string;
}

export const KasatuneLogoIcon: React.FC<KasatuneLogoIconProps> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none flex-shrink-0 transition-transform duration-200 ${className}`}
    >
      <defs>
        <linearGradient id="kasa-bg-react" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#161922" />
          <stop offset="100%" stopColor="#0B0D12" />
        </linearGradient>
        <linearGradient id="kasa-border-react" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F5A0" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#00D9F5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1DB954" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="kasa-accent-react" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F5A0" />
          <stop offset="50%" stopColor="#00D9F5" />
          <stop offset="100%" stopColor="#1DB954" />
        </linearGradient>
        <filter id="kasa-neon-react" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#00F5A0" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Rounded Squircle Container */}
      <rect width="32" height="32" rx="8.5" fill="url(#kasa-bg-react)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8" stroke="url(#kasa-border-react)" strokeWidth="1" />

      {/* Soundwave Monogram 'K' */}
      <g filter="url(#kasa-neon-react)">
        {/* Left Audio Stem (Vertical Bar) */}
        <rect x="6.5" y="6" width="3.5" height="20" rx="1.75" fill="url(#kasa-accent-react)" />

        {/* Top-Right Audio Beam */}
        <path d="M11.5 15.5L19.5 7.5" stroke="url(#kasa-accent-react)" strokeWidth="3.2" strokeLinecap="round" />

        {/* Bottom-Right Audio Beam */}
        <path d="M11.5 16.5L19.5 24.5" stroke="url(#kasa-accent-react)" strokeWidth="3.2" strokeLinecap="round" />

        {/* Acoustic Soundwave Ripple 1 */}
        <path d="M22.5 12C24 13.5 24 18.5 22.5 20" stroke="url(#kasa-accent-react)" strokeWidth="2.2" strokeLinecap="round" />

        {/* Acoustic Soundwave Ripple 2 */}
        <path d="M25.5 10C27.8 12.3 27.8 19.7 25.5 22" stroke="url(#kasa-accent-react)" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.5" />
      </g>
    </svg>
  );
};
