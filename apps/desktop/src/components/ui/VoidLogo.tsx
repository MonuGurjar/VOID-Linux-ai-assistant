interface VoidLogoProps {
  className?: string;
  size?: number;
}

export function VoidLogo({ className = "w-8 h-8", size }: VoidLogoProps) {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={style}>
      {/* 3D Ambient Glow behind logo */}
      <div className="absolute inset-0 bg-purple-600/40 rounded-full blur-md animate-pulse" />

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_4px_14px_rgba(168,85,247,0.6)]"
      >
        <defs>
          {/* Top Facet Gradient */}
          <linearGradient id="facetTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* Right Facet Gradient */}
          <linearGradient id="facetRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>

          {/* Left Facet Gradient */}
          <linearGradient id="facetLeft" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b21a8" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>

          {/* Core Singularity Glow */}
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#e9d5ff" />
            <stop offset="70%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7e22ce" stopOpacity="0" />
          </radialGradient>

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer 3D Hexagonal Prism Ring */}
        <path d="M50 10 L85 28 L50 46 L15 28 Z" fill="url(#facetTop)" />
        <path d="M85 28 L85 70 L50 88 L50 46 Z" fill="url(#facetRight)" />
        <path d="M15 28 L50 46 L50 88 L15 70 Z" fill="url(#facetLeft)" />

        {/* Inner 3D Inset Void - Hollow Center */}
        <path d="M50 28 L70 39 L50 56 L30 39 Z" fill="#090514" />
        <path d="M70 39 L70 60 L50 72 L50 56 Z" fill="#140a28" />
        <path d="M30 39 L50 56 L50 72 L30 60 Z" fill="#1e1038" />

        {/* Central Floating Purple Core Orb */}
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
