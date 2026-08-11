"use client";

interface CoffeeStainProps {
  position?: "top-right" | "bottom-left" | "top-left" | "bottom-right";
  opacity?: number;
  size?: number;
}

export default function CoffeeStain({
  position = "top-right",
  opacity = 0.08,
  size = 240,
}: CoffeeStainProps) {
  const positionStyles: Record<string, React.CSSProperties> = {
    "top-right": { top: "-40px", right: "-40px" },
    "bottom-left": { bottom: "-40px", left: "-40px" },
    "top-left": { top: "-40px", left: "-40px" },
    "bottom-right": { bottom: "-40px", right: "-40px" },
  };

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        zIndex: 0,
        pointerEvents: "none",
        opacity,
        ...positionStyles[position],
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer irregular coffee ring */}
        <path
          d="M100 15C148 13 186 52 184 100C182 147 144 185 96 183C48 181 12 143 14 96C16 48 52 17 100 15Z"
          stroke="var(--color-accent, #C1682F)"
          strokeWidth="6"
          strokeDasharray="12 4 8 6 18 3"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Inner coffee ring */}
        <path
          d="M100 28C140 26 172 58 170 98C168 137 135 168 95 166C55 164 25 133 27 94C29 55 60 30 100 28Z"
          stroke="var(--color-ink, #2B1B12)"
          strokeWidth="3"
          strokeDasharray="6 3 12 4"
          opacity="0.6"
        />

        {/* Coffee splatter droplets */}
        <circle cx="178" cy="45" r="3" fill="var(--color-accent, #C1682F)" opacity="0.7" />
        <circle cx="185" cy="55" r="1.5" fill="var(--color-accent, #C1682F)" opacity="0.5" />
        <circle cx="22" cy="150" r="2.5" fill="var(--color-accent, #C1682F)" opacity="0.6" />
        <circle cx="35" cy="165" r="4" fill="var(--color-ink, #2B1B12)" opacity="0.4" />
      </svg>
    </div>
  );
}
