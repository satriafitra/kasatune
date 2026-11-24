import React from 'react';

export interface KasatuneLogoProps {
  size?: number | string;
  className?: string;
  rounded?: string;
}

export const KasatuneLogoIcon: React.FC<KasatuneLogoProps> = ({
  size = 32,
  className = '',
  rounded = 'rounded-lg',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative overflow-hidden bg-white flex items-center justify-center flex-shrink-0 select-none shadow-sm ${rounded} ${className}`}
    >
      <img
        src="/kasatune-logo.jpg"
        alt="Kasatune"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
};
