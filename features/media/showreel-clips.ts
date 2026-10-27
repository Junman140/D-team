export type ShowreelClip = {
  id: string;
  label: string;
  title: string;
  durationLabel: string;
  poster: string;
  mp4: string;
  webm: string;
  width: number;
  height: number;
};

// Web-ready re-encodes of selected vertical clips (see
// scripts/generate-reel-videos.sh). User-controlled playback; no autoplay.
export const showreelClips: ShowreelClip[] = [
  {
    id: "reel-1",
    label: "CLIP 01",
    title: "Session motion · evening highlight",
    durationLabel: "0:15",
    poster: "/videos/reel-1-poster.jpg",
    mp4: "/videos/reel-1.mp4",
    webm: "/videos/reel-1.webm",
    width: 720,
    height: 1280,
  },
  {
    id: "reel-2",
    label: "CLIP 02",
    title: "Session motion · walking coverage",
    durationLabel: "0:28",
    poster: "/videos/reel-2-poster.jpg",
    mp4: "/videos/reel-2.mp4",
    webm: "/videos/reel-2.webm",
    width: 720,
    height: 1280,
  },
  {
    id: "reel-3",
    label: "CLIP 03",
    title: "Session motion · hall run-through",
    durationLabel: "0:36",
    poster: "/videos/reel-3-poster.jpg",
    mp4: "/videos/reel-3.mp4",
    webm: "/videos/reel-3.webm",
    width: 720,
    height: 1280,
  },
];
