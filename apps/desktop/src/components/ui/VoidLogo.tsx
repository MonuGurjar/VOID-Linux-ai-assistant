import { useTheme, WallpaperTheme } from "@/hooks/useTheme";

interface VoidLogoProps {
  className?: string;
  size?: number;
  theme?: WallpaperTheme;
}

export function VoidLogo({ className = "w-8 h-8", size, theme: overrideTheme }: VoidLogoProps) {
  const { theme: activeTheme } = useTheme();
  const currentTheme = overrideTheme || activeTheme;
  const isObsidian = currentTheme === "obsidian";

  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={style}>
      {/* 3D Ambient Glow behind logo */}
      <div
        className={`absolute inset-0 rounded-full blur-md animate-pulse transition-all duration-300 ${
          isObsidian ? "bg-white/30" : "bg-blue-600/40"
        }`}
      />

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full relative z-10 transition-all duration-300 ${
          isObsidian
            ? "drop-shadow-[0_4px_16px_rgba(255,255,255,0.6)]"
            : "drop-shadow-[0_4px_14px_rgba(37,99,235,0.6)]"
        }`}
      >
        <defs>
          {isObsidian ? (
            <>
              {/* Obsidian Top Facet Gradient */}
              <linearGradient id="facetTopObsidian" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#e4e4e7" />
                <stop offset="100%" stopColor="#a1a1aa" />
              </linearGradient>

              {/* Obsidian Right Facet Gradient */}
              <linearGradient id="facetRightObsidian" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a1a1aa" />
                <stop offset="100%" stopColor="#52525b" />
              </linearGradient>

              {/* Obsidian Left Facet Gradient */}
              <linearGradient id="facetLeftObsidian" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3f3f46" />
                <stop offset="100%" stopColor="#18181b" />
              </linearGradient>

              {/* Platinum Core Singularity Glow */}
              <radialGradient id="coreGlowObsidian" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#f4f4f5" />
                <stop offset="75%" stopColor="#a1a1aa" />
                <stop offset="100%" stopColor="#3f3f46" stopOpacity="0" />
              </radialGradient>
            </>
          ) : (
            <>
              {/* Cosmic Blue Top Facet Gradient */}
              <linearGradient id="facetTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>

              {/* Cosmic Blue Right Facet Gradient */}
              <linearGradient id="facetRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>

              {/* Cosmic Blue Left Facet Gradient */}
              <linearGradient id="facetLeft" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e40af" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Cosmic Core Singularity Glow */}
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#bae6fd" />
                <stop offset="70%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
              </radialGradient>
            </>
          )}

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer 3D Hexagonal Prism Ring */}
        <path
          d="M50 10 L85 28 L50 46 L15 28 Z"
          fill={isObsidian ? "url(#facetTopObsidian)" : "url(#facetTop)"}
        />
        <path
          d="M85 28 L85 70 L50 88 L50 46 Z"
          fill={isObsidian ? "url(#facetRightObsidian)" : "url(#facetRight)"}
        />
        <path
          d="M15 28 L50 46 L50 88 L15 70 Z"
          fill={isObsidian ? "url(#facetLeftObsidian)" : "url(#facetLeft)"}
        />

        {/* Inner 3D Inset Void - Hollow Center */}
        <path
          d="M50 28 L70 39 L50 56 L30 39 Z"
          fill={isObsidian ? "#09090b" : "#04091a"}
        />
        <path
          d="M70 39 L70 60 L50 72 L50 56 Z"
          fill={isObsidian ? "#18181b" : "#0a142e"}
        />
        <path
          d="M30 39 L50 56 L50 72 L30 60 Z"
          fill={isObsidian ? "#27272a" : "#0f1e42"}
        />

        {/* Central Floating Core Orb */}
        <circle
          cx="50"
          cy="48"
          r="8"
          fill={isObsidian ? "url(#coreGlowObsidian)" : "url(#coreGlow)"}
          filter="url(#glowFilter)"
        />
      </svg>
    </div>
  );
}
