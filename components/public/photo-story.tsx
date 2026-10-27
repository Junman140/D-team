"use client";

import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import type { OnSetImage } from "@/features/media/on-set-images";

export function PhotoStory({ images }: { images: OnSetImage[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [sitePaused, setSitePaused] = useState(false);
  const active = images[index];

  const move = useCallback(
    (direction: 1 | -1) => {
      setIndex((current) => (current + direction + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (index >= images.length) setIndex(0);
  }, [images.length, index]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setSitePaused(root.dataset.motionPaused === "true");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-motion-paused"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (images.length < 2 || paused || sitePaused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [images.length, paused, sitePaused, reducedMotion]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  }

  if (!active) return null;

  return (
    <div
      className="photo-story"
      onKeyDown={onKeyDown}
    >
      <div className="photo-story-stage">
        <figure className="photo-story-frame" key={active.id}>
          <img
            alt={active.alt}
            height={active.height}
            loading="eager"
            sizes="(max-width: 760px) 90vw, 68vw"
            src={active.src}
            srcSet={active.srcSet}
            width={active.width}
          />
          <figcaption>
            <span>ON SET / BEHIND THE WORK</span>
            {images.length > 1 && !reducedMotion && (
              <button
                className="photo-story-motion-toggle"
                type="button"
                aria-pressed={paused}
                aria-label={paused ? "Resume photo story motion" : "Pause photo story motion"}
                onClick={() => setPaused((value) => !value)}
              >
                <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span> {paused ? "PLAY" : "PAUSE"}
              </button>
            )}
            <span aria-live="polite">{String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
          </figcaption>
        </figure>
        <div className="photo-story-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Show previous photograph">←</button>
          <p aria-live="polite" aria-atomic="true">{active.alt}</p>
          <button type="button" onClick={() => move(1)} aria-label="Show next photograph">→</button>
        </div>
      </div>
      <div className="photo-story-thumbs" role="group" aria-label="Choose a photograph">
        {images.map((image, imageIndex) => (
          <button
            className={imageIndex === index ? "is-active" : ""}
            type="button"
            key={image.id}
            onClick={() => setIndex(imageIndex)}
            aria-label={`Show photograph ${imageIndex + 1}: ${image.alt}`}
            aria-current={imageIndex === index ? "true" : undefined}
          >
            <img
              alt=""
              height={image.height}
              loading="lazy"
              sizes="120px"
              src={image.src}
              srcSet={image.srcSet}
              width={image.width}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
