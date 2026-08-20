"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { SunIcon, MoonIcon } from "./Icons";

type Theme = "light" | "dark";

function subscribe() {
  return () => {};
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("brew_warm_theme") as Theme | null;
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const isMounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);



  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("brew_warm_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  if (!isMounted) {
    return (
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "var(--radius-sm)",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        color: "var(--color-accent)",
        cursor: "pointer",
        transition: "all 200ms ease",
      }}
    >
      {theme === "light" ? <MoonIcon size={16} /> : <SunIcon size={16} />}
    </button>
  );
}
