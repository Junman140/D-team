"use client";

import { useEffect, useState } from "react";

export function MotionControl({ context = "site" }: { context?: "site" | "workspace" }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setPaused(root.dataset.motionPaused === "true");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-motion-paused"] });
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const next = !paused;
    document.documentElement.dataset.motionPaused = String(next);
    setPaused(next);
  }

  return (
    <button
      className="motion-control"
      type="button"
      aria-pressed={paused}
      aria-label={paused ? `Resume ${context} motion` : `Pause ${context} motion`}
      onClick={toggle}
    >
      <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
      <span className="motion-control-label">{paused ? "Motion paused" : "Motion on"}</span>
    </button>
  );
}
