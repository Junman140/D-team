export type SiteImage = {
  id: string;
  alt: string;
  width: number;
  height: number;
  src: string;
  srcSet?: string;
};

function image(id: string, alt: string, width: number, height: number): SiteImage {
  return {
    id,
    alt,
    width,
    height,
    src: `/media/site/${id}-960.webp`,
    srcSet: `/media/site/${id}-480.webp 480w, /media/site/${id}-960.webp 960w`,
  };
}

// Hero: user-mandated master is only 1002px wide, so the widest derivative is
// capped at the master size (file is named -1600 but measures 1002x837).
export const heroImage: SiteImage = {
  id: "hero",
  alt: "Stage lighting beams cutting through haze above a seated congregation.",
  width: 1002,
  height: 837,
  src: "/media/site/hero-960.webp",
  srcSet: "/media/site/hero-480.webp 480w, /media/site/hero-960.webp 960w, /media/site/hero-1600.webp 1002w",
};

// Frames from the crew's own sets for the homepage intro mosaic. These are
// studio library frames, not representations of named client deliverables.
export const introGallery: SiteImage[] = [
  image("drone", "A camera drone hovering in flight above a dark stage.", 960, 742),
  image("cinematic", "Camera mounted on a gimbal rig above a live keyboard performance.", 960, 640),
  image("workdesk", "The team at their desktop editing stations in the studio office.", 960, 640),
  image("pilot", "Drone pilot preparing the aircraft at the media pit.", 960, 640),
  image("stream1", "On-site media station with phones, laptops, and live folders.", 960, 640),
];

// Frames used behind the homepage "selected work" mosaic while draft/preview
// portfolio entries have no cover assets of their own.
export const workMosaic: SiteImage[] = [
  image("work10", "Worship leader mid-song at a packed night service.", 960, 640),
  image("work7", "Black-and-white wide of a preacher facing a full congregation hall.", 960, 588),
  image("church", "Event photographer filming against a glowing blue stage wall.", 960, 640),
];

// Additional wide crew frames for the team and brochure pages.
export const crewGallery: SiteImage[] = [
  image("team2", "Two team members reviewing a session together at the desk.", 960, 640),
  image("editors", "Editors focused on their screens at the live media table.", 960, 640),
  image("teamdancing", "Crew kneeling in formation mid-performance at an anniversary show.", 960, 640),
];

export type EventCover = {
  alt: string;
  width: number;
  height: number;
  src: string;
  srcSet?: string;
};

// Curated cover frames for the owner-named event coverage drafts, keyed by
// portfolio slug. Widths reflect the real derivative pixel widths.
export const eventCovers: Record<string, EventCover> = {
  "tph-worship-experience": {
    alt: "TPH crew filming a worship performance from inside the congregation.",
    width: 1600,
    height: 1067,
    src: "/media/on-set/cam2-960.webp",
    srcSet: "/media/on-set/cam2-480.webp 480w, /media/on-set/cam2-960.webp 960w, /media/on-set/cam2-1600.webp 1600w",
  },
  "kpr-pistis-place-26": {
    alt: "Camera operators filming the Kingdom Prayer Retreat evening session.",
    width: 1600,
    height: 1067,
    src: "/media/on-set/cam-960.webp",
    srcSet: "/media/on-set/cam-480.webp 480w, /media/on-set/cam-960.webp 960w, /media/on-set/cam-1600.webp 1600w",
  },
  "halleluyah-experience-10": {
    alt: "Halleluyah Experience 10 principal camera operators comparing shots on tripod rigs.",
    width: 1600,
    height: 1067,
    src: "/media/on-set/maincameras-960.webp",
    srcSet: "/media/on-set/maincameras-480.webp 480w, /media/on-set/maincameras-960.webp 960w, /media/on-set/maincameras-1600.webp 1600w",
  },
  "living-portals": {
    alt: "Vocalists performing on the Living Portals stage.",
    width: 960,
    height: 640,
    src: "/media/site/work4-960.webp",
    srcSet: "/media/site/work4-480.webp 480w, /media/site/work4-960.webp 960w",
  },
  eucharistia: {
    alt: "Eucharistia photographer filming against a glowing blue stage wall.",
    width: 960,
    height: 640,
    src: "/media/site/church-960.webp",
    srcSet: "/media/site/church-480.webp 480w, /media/site/church-960.webp 960w",
  },
  "vc-townhall-meeting": {
    alt: "VC Townhall Meeting photographer working a decorated school hall.",
    width: 960,
    height: 640,
    src: "/media/site/school-960.webp",
    srcSet: "/media/site/school-480.webp 480w, /media/site/school-960.webp 960w",
  },
};
