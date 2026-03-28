import React from 'react';

interface MedMemoLogoProps {
  size?: number;
  className?: string;
}

/**
 * MedMemo logo — stethoscope + sparkle mark.
 * Renders as a rounded square with gradient background.
 */
export function MedMemoLogo({ size = 32, className = '' }: MedMemoLogoProps) {
  const inner = Math.round(size * 0.5);
  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cross / plus — medical symbol */}
        <rect x="9" y="3" width="6" height="18" rx="2" fill="white" fillOpacity="0.95" />
        <rect x="3" y="9" width="18" height="6" rx="2" fill="white" fillOpacity="0.95" />
        {/* Sparkle dot — AI indicator */}
        <circle cx="19" cy="5" r="2.5" fill="white" fillOpacity="0.7" />
        <circle cx="19" cy="5" r="1.2" fill="white" />
      </svg>
    </div>
  );
}

/**
 * Inline logo mark for smaller uses (nav, footer).
 */
export function MedMemoMark({ size = 24 }: { size?: number }) {
  const inner = Math.round(size * 0.6);
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="9" y="3" width="6" height="18" rx="2" fill="white" fillOpacity="0.95" />
        <rect x="3" y="9" width="18" height="6" rx="2" fill="white" fillOpacity="0.95" />
        <circle cx="19" cy="5" r="2" fill="white" fillOpacity="0.7" />
        <circle cx="19" cy="5" r="1" fill="white" />
      </svg>
    </div>
  );
}
