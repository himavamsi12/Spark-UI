export default function Logo({ size = 24, strikeId = 0 }: { size?: number; strikeId?: number }) {
  return (
    <svg width={size} height={size} viewBox="40 20 140 140" className="shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="logoGradTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffdca8" />
          <stop offset="100%" stopColor="var(--color-lavender-beam)" />
        </linearGradient>
        <linearGradient id="logoGradMid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-lavender-beam)" />
          <stop offset="100%" stopColor="var(--color-iris-glow)" />
        </linearGradient>
        <linearGradient id="logoGradShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-iris-glow)" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
        <clipPath id="logoClip">
          <rect x="58" y="38" width="124" height="124" rx="27" />
        </clipPath>
      </defs>

      <rect
        x="60"
        y="40"
        width="120"
        height="120"
        rx="26"
        fill="none"
        stroke="var(--color-pearl)"
        strokeOpacity="0.4"
        strokeWidth="4"
      />

      <g clipPath="url(#logoClip)">
        {/* Thunder flash: a bright wash that strikes just as the bolt lands. */}
        <rect
          key={`flash-${strikeId}`}
          x="60"
          y="40"
          width="120"
          height="120"
          fill="var(--color-lavender-beam)"
          style={{ animation: "originThunderFlash 0.85s ease-out both", mixBlendMode: "screen" }}
        />

        <g
          key={`bolt-${strikeId}`}
          style={{ transformOrigin: "120px 40px", animation: "originThunderFall 0.85s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          <path d="M140 66 L92 114 L116 114 L106 138 L152 92 L126 92 Z" fill="url(#logoGradShadow)" transform="translate(4,4)" />
          <path d="M138 62 L88 112 L114 112 L124 88 Z" fill="url(#logoGradTop)" />
          <path d="M114 112 L102 138 L152 88 L124 88 Z" fill="url(#logoGradMid)" />
          <path d="M138 62 L124 88 L114 88 Z" fill="#fef3c7" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
}
