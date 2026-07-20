interface VoidLogoProps {
  className?: string;
  size?: number;
}

export function VoidLogo({ className = "w-8 h-8", size }: VoidLogoProps) {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={style}>
      {/* 3D Ambient Glow behind logo */}
      <div className="absolute inset-0 bg-blue-600/40 rounded-full blur-md animate-pulse" />

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_4px_14px_rgba(37,99,235,0.6)]"
      >
        <defs>
          {/* Top Facet Gradient */}
          <linearGradient id="facetTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          {/* Right Facet Gradient */}
          <linearGradient id="facetRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          {/* Left Facet Gradient */}
          <linearGradient id="facetLeft" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Core Singularity Glow */}
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#bae6fd" />
            <stop offset="70%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
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
        <path d="M50 28 L70 39 L50 56 L30 39 Z" fill="#04091a" />
        <path d="M70 39 L70 60 L50 72 L50 56 Z" fill="#0a142e" />
        <path d="M30 39 L50 56 L50 72 L30 60 Z" fill="#0f1e42" />

        {/* Central Floating Blue Core Orb */}
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
