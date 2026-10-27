"use client";

import { useEffect, useState } from "react";

export type MarqueeItem = { slug: string; name: string };

function MarqueeRow({
  items,
  offset,
  reverse = false,
  duration = 42,
}: {
  items: MarqueeItem[];
  offset: number;
  reverse?: boolean;
  duration?: number;
}) {
  const group = (duplicate: boolean) => (
    <ul className="marquee-group" aria-hidden={duplicate || undefined}>
      {items.map((item, index) => (
        <li key={item.slug}>
          <a
            className="service-pill"
            href={`/services/${item.slug}`}
            tabIndex={duplicate ? -1 : undefined}
          >
            <span className="service-pill-number">{String(offset + index + 1).padStart(2, "0")}</span>
            <span className="service-pill-name">{item.name}</span>
            <span className="service-pill-dot" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`marquee${reverse ? " marquee--reverse" : ""}`}>
      <div className="marquee-track" style={{ animationDuration: `${duration}s` }}>
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}

export function ServicesMarquee({ services }: { services: MarqueeItem[] }) {
  const [paused, setPaused] = useState(false);
  const [sitePaused, setSitePaused] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setSitePaused(root.dataset.motionPaused === "true");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-motion-paused"] });
    return () => observer.disconnect();
  }, []);
  if (!services.length) return null;

  const half = Math.ceil(services.length / 2);
  const rows = [services.slice(0, half), services.slice(half)];

  return (
    <div className="services-marquee" data-paused={paused}>
      <div className="services-marquee-bar">
        <span className="tick-row" aria-hidden="true">
          <b>1</b><i /><b>6</b><i /><b>0</b><i /><b>0</b>
        </span>
        <button
          className="marquee-toggle"
          type="button"
          aria-pressed={paused || sitePaused}
          disabled={sitePaused}
          onClick={() => setPaused((value) => !value)}
        >
          <span aria-hidden="true">{paused || sitePaused ? "▶" : "❚❚"}</span>
          {sitePaused ? "Paused globally" : paused ? "Play motion" : "Pause motion"}
        </button>
      </div>
      {rows.map((row, index) => (
        <MarqueeRow
          key={index}
          items={row}
          offset={index * half}
          reverse={index === 1}
          duration={index === 0 ? 38 : 48}
        />
      ))}
    </div>
  );
}

export function LiveClock() {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <span className="live-clock">{time}</span>;
}
