import React from 'react';

interface VoidLogoProps {
  className?: string;
  size?: number;
}

export function VoidLogo({ className = "w-8 h-8", size }: VoidLogoProps) {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={style}>
      {/* 3D Ambient Glow behind logo */}
      <div className="absolute inset-0 bg-red-600/30 rounded-full blur-md animate-pulse" />

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_4px_12px_rgba(239,68,68,0.5)]"
      >
        <defs>
          {/* Top Facet Gradient */}
          <linearGradient id="facetTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>

          {/* Right Facet Gradient */}
          <linearGradient id="facetRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          {/* Left Facet Gradient */}
          <linearGradient id="facetLeft" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7f1d1d" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          {/* Core Singularity Glow */}
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer 3D Hexagonal Prism Ring */}
        {/* Top Segment */}
        <path
          d="M50 10 L85 28 L50 46 L15 28 Z"
          fill="url(#facetTop)"
        />

        {/* Right Segment */}
        <path
          d="M85 28 L85 70 L50 88 L50 46 Z"
          fill="url(#facetRight)"
        />

        {/* Left Segment */}
        <path
          d="M15 28 L50 46 L50 88 L15 70 Z"
          fill="url(#facetLeft)"
        />

        {/* Inner 3D Inset Void - Hollow Center */}
        <path
          d="M50 28 L70 39 L50 56 L30 39 Z"
          fill="#0a0a0d"
        />
        <path
          d="M70 39 L70 60 L50 72 L50 56 Z"
          fill="#141418"
        />
        <path
          d="M30 39 L50 56 L50 72 L30 60 Z"
          fill="#1c1c24"
        />

        {/* Central Floating Red Core Orb */}
        <circle
          cx="50"
          cy="48"
          r="8"
          fill="url(#coreGlow)"
          filter="url(#glowFilter)"
        />
      </svg>
    </div>
  );
}
