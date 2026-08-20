"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Step data ─── */
const STEPS = [
  {
    emoji: "🗺️",
    title: "discover local cafés",
    body: "Pan and zoom the map to explore coffee shops around you. Use the search bar to jump to any city or neighborhood worldwide.",
    tip: "Click any pin to see full details — hours, directions, coordinates, and more.",
    tipIcon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(193,104,47,0.10) 0%, rgba(193,104,47,0.03) 100%)",
    accent: "☕",
  },
  {
    emoji: "🎧",
    title: "filters & ambient vibes",
    body: "Narrow your search with filters like Wi-Fi, outdoor seating, and open hours. Tap café vibes to enable soothing lofi rain ambience while you explore.",
    tip: 'Feeling adventurous? Hit "Surprise Me" to discover a random hidden gem nearby.',
    tipIcon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.8h6.1l-5 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8-5-3.6h6.1z" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(193,104,47,0.08) 0%, rgba(116,78,170,0.06) 100%)",
    accent: "🎶",
  },
  {
    emoji: "♥️",
    title: "save & contribute",
    body: "Heart your favorite spots to build a personal café passport — no signup needed. Notice a gem that's missing? Hit + add café to contribute to the community map.",
    tip: "Your saved collection persists in this browser between visits.",
    tipIcon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(193,104,47,0.10) 0%, rgba(220,60,60,0.05) 100%)",
    accent: "➕",
  },
];

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevOpenRef = useRef(isOpen);

  /* Animate entrance — use rAF callbacks to avoid synchronous setState in effect */
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      // Just opened — reset step via rAF to avoid synchronous setState
      requestAnimationFrame(() => {
        setStep(0);
        requestAnimationFrame(() => setVisible(true));
      });
    } else if (!isOpen && prevOpenRef.current) {
      requestAnimationFrame(() => setVisible(false));
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  /* Escape key */
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const goTo = useCallback(
    (next: number) => {
      setAnimating(true);
      setTimeout(() => {
        setStep(next);
        setAnimating(false);
      }, 200);
    },
    []
  );

  if (!isOpen) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 350ms ease",
        }}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Brew Warm"
        style={{
          position: "fixed",
          zIndex: 10001,
          top: "50%",
          left: "50%",
          transform: visible
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -46%) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "all 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          width: "min(460px, calc(100vw - 2rem))",
          maxHeight: "calc(100vh - 3rem)",
          overflowY: "auto",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text-primary)",
          borderRadius: "20px",
          boxShadow:
            "0 25px 60px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(var(--rgb-ink), 0.08)",
          padding: 0,
        }}
      >
        {/* Hero header strip */}
        <div
          style={{
            background: current.gradient,
            padding: "2rem 2rem 1.5rem 2rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative coffee ring */}
          <div
            style={{
              position: "absolute",
              top: "-30px",
              right: "-20px",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              border: "3px solid rgba(var(--rgb-accent), 0.08)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-20px",
              right: "-10px",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              border: "2px solid rgba(var(--rgb-accent), 0.05)",
              pointerEvents: "none",
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close welcome guide"
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text-secondary)",
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 150ms ease",
              zIndex: 2,
            }}
          >
            ×
          </button>

          {/* Step counter pills */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem" }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  height: "4px",
                  flex: 1,
                  borderRadius: "2px",
                  backgroundColor:
                    i <= step
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                  transition: "background-color 300ms ease",
                }}
              />
            ))}
          </div>

          <p
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
            }}
          >
            welcome to brew warm · 0{step + 1} / 0{STEPS.length}
          </p>

          {/* Emoji + Title */}
          <div
            style={{
              opacity: animating ? 0 : 1,
              transform: animating ? "translateY(8px)" : "translateY(0)",
              transition: "all 200ms ease",
            }}
          >
            <span style={{ fontSize: "2.75rem", display: "block", marginBottom: "0.4rem" }}>
              {current.emoji}
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display, Georgia, serif)",
                fontSize: "1.55rem",
                fontWeight: 600,
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {current.title}
            </h2>
          </div>
        </div>

        {/* Body content */}
        <div style={{ padding: "1.5rem 2rem 2rem 2rem" }}>
          <div
            style={{
              opacity: animating ? 0 : 1,
              transform: animating ? "translateY(6px)" : "translateY(0)",
              transition: "all 200ms ease 50ms",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body, sans-serif)",
                fontSize: "0.95rem",
                lineHeight: 1.7,
                color: "var(--color-text-secondary)",
                margin: "0 0 1.25rem 0",
              }}
            >
              {current.body}
            </p>

            {/* Tip card */}
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "12px",
                backgroundColor: "var(--color-surface, rgba(0,0,0,0.03))",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  marginTop: "2px",
                  color: "var(--color-accent)",
                }}
              >
                {current.tipIcon}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  lineHeight: 1.55,
                  color: "var(--color-text-primary)",
                }}
              >
                {current.tip}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            {/* Left button */}
            {step > 0 ? (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                style={{
                  padding: "0.55rem 1.1rem",
                  borderRadius: "100px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                ← back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "0.55rem 1.1rem",
                  borderRadius: "100px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  opacity: 0.7,
                  transition: "opacity 150ms ease",
                }}
              >
                skip tour
              </button>
            )}

            {/* Right button */}
            {!isLast ? (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                style={{
                  padding: "0.55rem 1.4rem",
                  borderRadius: "100px",
                  backgroundColor: "var(--color-accent)",
                  color: "#fff",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px -2px rgba(var(--rgb-accent), 0.4)",
                  transition: "all 150ms ease",
                }}
              >
                next →
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "0.6rem 1.6rem",
                  borderRadius: "100px",
                  backgroundColor: "var(--color-accent)",
                  color: "#fff",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 12px -2px rgba(var(--rgb-accent), 0.45)",
                  transition: "all 150ms ease",
                }}
              >
                start exploring ☕
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
