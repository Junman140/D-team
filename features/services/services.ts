export const serviceOfferings = [
  {
    slug: "production-direction",
    name: "Production direction",
    discipline: "PRODUCTION",
    summary: "Lead the brief, build the right crew, and hold the whole production together from first plan to final delivery.",
  },
  {
    slug: "film-cinematography",
    name: "Film & cinematography",
    discipline: "FILM",
    summary: "Plan and capture moving images for stories, campaigns, documentaries, and live events.",
  },
  {
    slug: "photography",
    name: "Photography",
    discipline: "IMAGE MAKING",
    summary: "Create still images for events, people, campaigns, products, and editorial work.",
  },
  {
    slug: "livestream-production",
    name: "Livestream & broadcast",
    discipline: "LIVE",
    summary: "Shape a live production from camera plan and vision mixing through broadcast output and recording.",
  },
  {
    slug: "event-production",
    name: "Event production",
    discipline: "ON SET",
    summary: "Coordinate the creative, technical, and backstage work that makes a live event feel effortless.",
  },
  {
    slug: "content-creation",
    name: "Content creation",
    discipline: "CONTENT",
    summary: "Create platform-ready content with the people, pace, and formats each channel needs.",
  },
  {
    slug: "social-media-management",
    name: "Social media management",
    discipline: "CONTENT",
    summary: "Plan, capture, publish, and learn from a consistent social presence around the work.",
  },
  {
    slug: "graphics-motion-design",
    name: "Graphics & motion design",
    discipline: "DESIGN",
    summary: "Build graphic systems, titles, motion pieces, and digital assets that carry the idea further.",
  },
  {
    slug: "sound-engineering",
    name: "Sound engineering",
    discipline: "AUDIO",
    summary: "Design and run audio for live rooms, broadcasts, and recorded productions with a clean signal from source to output.",
  },
  {
    slug: "lighting-engineering",
    name: "Lighting engineering",
    discipline: "TECHNICAL",
    summary: "Light people, stages, and spaces with intent, from the first plot through live operation.",
  },
  {
    slug: "led-video-engineering",
    name: "LED & video engineering",
    discipline: "TECHNICAL",
    summary: "Specify, build, and run LED screens and video systems for live stages, worship, conferences, and broadcast.",
  },
  {
    slug: "front-of-house",
    name: "Front of house",
    discipline: "LIVE",
    summary: "Look after guest flow, artist and crew liaison, and the parts of the day that happen before the show starts.",
  },
  {
    slug: "in-house-production",
    name: "In-house production & crewing",
    discipline: "PRODUCTION",
    summary: "Become the production team behind a venue, brand, church, or organisation with an ongoing crew and workflow.",
  },
  {
    slug: "social-media-build",
    name: "Social media build & management",
    discipline: "CONTENT",
    summary: "Build and run a social presence from the ground up—channel strategy, setup, content systems, publishing, and reporting.",
  },
  {
    slug: "network-engineering",
    name: "Network engineering",
    discipline: "TECHNICAL",
    summary: "Design and run the connectivity behind live venues, broadcast workflows, and media teams so every signal has a reliable path.",
  },
  {
    slug: "software-systems-engineering",
    name: "Software & systems engineering",
    discipline: "TECHNICAL",
    summary: "Build the websites, tools, and media systems that keep a creative operation organised, searchable, and online.",
  },
] as const;

export type ServiceOffering = (typeof serviceOfferings)[number];

export function getServiceOffering(slug: string) {
  return serviceOfferings.find((service) => service.slug === slug);
}
