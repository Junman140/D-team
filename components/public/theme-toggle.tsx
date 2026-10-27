"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sync = () => setTheme(currentTheme());
    sync();
    window.addEventListener("dte-theme", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("dte-theme", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function toggleTheme() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem("dte-theme", next);
      } catch {
        // The theme still applies for this page even when storage is unavailable.
      }
      window.dispatchEvent(new Event("dte-theme"));
      setTheme(next);
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startViewTransition = (
      document as Document & { startViewTransition?: (callback: () => void) => unknown }
    ).startViewTransition;

    if (!reduceMotion && typeof startViewTransition === "function") {
      const bounds = buttonRef.current?.getBoundingClientRect();
      const x = bounds ? bounds.left + bounds.width / 2 : window.innerWidth - 40;
      const y = bounds ? bounds.top + bounds.height / 2 : 0;
      document.documentElement.style.setProperty("--theme-x", `${x}px`);
      document.documentElement.style.setProperty("--theme-y", `${y}px`);
      startViewTransition.call(document, apply);
      return;
    }

    apply();
  }

  return (
    <button
      className={`theme-toggle${className ? ` ${className}` : ""}`}
      type="button"
      onClick={toggleTheme}
      ref={buttonRef}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={theme === "dark"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      <svg className="theme-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
          </>
        ) : (
          <path d="M20.5 14.2A8.4 8.4 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
        )}
      </svg>
      <span className="theme-toggle-label">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
