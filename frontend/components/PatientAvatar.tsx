'use client';

import React from 'react';

// Deterministic hash from string → number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash);
}

// Curated gradient palette — warm, vibrant, accessible on white text
const GRADIENT_PAIRS: [string, string][] = [
  ['#6366f1', '#8b5cf6'], // indigo → violet
  ['#3b82f6', '#6366f1'], // blue → indigo
  ['#06b6d4', '#3b82f6'], // cyan → blue
  ['#10b981', '#06b6d4'], // emerald → cyan
  ['#f59e0b', '#ef4444'], // amber → red
  ['#ef4444', '#ec4899'], // red → pink
  ['#ec4899', '#8b5cf6'], // pink → violet
  ['#8b5cf6', '#6366f1'], // violet → indigo
  ['#14b8a6', '#0ea5e9'], // teal → sky
  ['#f97316', '#ef4444'], // orange → red
  ['#0ea5e9', '#6366f1'], // sky → indigo
  ['#84cc16', '#10b981'], // lime → emerald
];

function getGradient(name: string): [string, string] {
  const idx = hashString(name) % GRADIENT_PAIRS.length;
  return GRADIENT_PAIRS[idx];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type PatientAvatarSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<PatientAvatarSize, string> = {
  sm: 'w-8 h-8 text-xs rounded-lg',
  md: 'w-10 h-10 text-sm rounded-xl',
  lg: 'w-16 h-16 text-2xl rounded-2xl shadow-md',
};

export function PatientAvatar({
  name,
  size = 'md',
  className = '',
}: {
  name: string;
  size?: PatientAvatarSize;
  className?: string;
}) {
  const [from, to] = getGradient(name);
  const initials = getInitials(name);

  return (
    <div
      className={`flex items-center justify-center font-semibold text-white shrink-0 select-none ${sizeClasses[size]} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      role="img"
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </div>
  );
}
