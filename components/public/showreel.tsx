"use client";

import { showreelClips } from "@/features/media/showreel-clips";

export function Showreel() {
  if (!showreelClips.length) return null;

  return (
    <div
      className="stories-row"
      role="list"
      aria-label="D-Team showreel clips, scroll sideways"
    >
      {showreelClips.map((clip) => (
        <figure
          className="story-card"
          key={clip.id}
          role="listitem"
          title={clip.title}
        >
          <video
            aria-label={`D-Team showreel clip: ${clip.title}`}
            controls
            playsInline
            preload="none"
            poster={clip.poster}
          >
            <source src={clip.mp4} type="video/mp4" />
            <source src={clip.webm} type="video/webm" />
            Your browser does not support embedded video.
          </video>
          <figcaption aria-hidden="true">
            <span className="story-label">{clip.label}</span>
            <span className="story-duration">{clip.durationLabel}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
