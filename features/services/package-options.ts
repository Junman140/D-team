/** Equipment kit rates transcribed from the D-Team quotation master. */
export type PackageOption = {
  id: string;
  name: string;
  summary: string;
  bestFor: string;
  features: string[];
  rateAmount: number;
};

export type QuoteItem = { id: string; name: string; group: "Equipment" | "Crew"; rate: number; unit: "day" | "month" | "video" | "job" | "included"; includedWith?: string };

export const quoteItems: QuoteItem[] = [
  { id: "camera-standard", name: "Standard Sony camera (streaming)", group: "Equipment", rate: 15_000, unit: "day" },
  { id: "fx30-body", name: "Sony FX30, body only", group: "Equipment", rate: 30_000, unit: "day" },
  { id: "fx30-lens", name: "Sony FX30 with 70–200mm lens", group: "Equipment", rate: 55_000, unit: "day" },
  { id: "drone", name: "Drone", group: "Equipment", rate: 50_000, unit: "day" },
  { id: "gimbal", name: "Gimbal", group: "Equipment", rate: 25_000, unit: "day" },
  { id: "tripod", name: "Tripod", group: "Equipment", rate: 5_000, unit: "day" },
  { id: "switcher", name: "8-input video switcher", group: "Equipment", rate: 50_000, unit: "day" },
  { id: "laptop", name: "Laptop", group: "Equipment", rate: 10_000, unit: "day" },
  { id: "sound-card", name: "Audio sound card with cable", group: "Equipment", rate: 5_000, unit: "day" },
  { id: "battery", name: "Extra battery", group: "Equipment", rate: 5_000, unit: "day" },
  { id: "transmitter", name: "Transmitter", group: "Equipment", rate: 15_000, unit: "day" },
  { id: "transmitter-stand", name: "Transmitter stand", group: "Equipment", rate: 4_000, unit: "day" },
  { id: "capture-card", name: "Capture card", group: "Equipment", rate: 3_000, unit: "day" },
  { id: "splitter", name: "Splitter", group: "Equipment", rate: 5_000, unit: "day" },
  { id: "usb-hub", name: "USB hub", group: "Equipment", rate: 2_000, unit: "day" },
  { id: "hdmi-long", name: "HDMI cable (10m / 30m)", group: "Equipment", rate: 5_000, unit: "day" },
  { id: "hdmi-short", name: "Short HDMI cable", group: "Equipment", rate: 2_000, unit: "day" },
  { id: "lan", name: "LAN cable (30m)", group: "Equipment", rate: 4_000, unit: "day" },
  { id: "router", name: "Airtel ODU router", group: "Equipment", rate: 20_000, unit: "day" },
  { id: "extension", name: "Extension cords + dummy battery set", group: "Equipment", rate: 20_000, unit: "day" },
  { id: "monitors", name: "PGM + multiview monitors", group: "Equipment", rate: 0, unit: "included", includedWith: "Included in Kit C" },
  { id: "ndi", name: "NDI, graphics, mixer + XLR cables", group: "Equipment", rate: 0, unit: "included", includedWith: "Included in Kit C" },
  { id: "video-editor", name: "Video editing", group: "Crew", rate: 0, unit: "included", includedWith: "Included in production fee" },
  { id: "photographer-day", name: "Photographer", group: "Crew", rate: 25_000, unit: "day" },
  { id: "photographer-month", name: "Photographer (monthly)", group: "Crew", rate: 150_000, unit: "month" },
  { id: "designer-day", name: "Graphic designer", group: "Crew", rate: 25_000, unit: "day" },
  { id: "designer-month", name: "Graphic designer (monthly)", group: "Crew", rate: 150_000, unit: "month" },
  { id: "creator-video", name: "Content creator", group: "Crew", rate: 15_000, unit: "video" },
  { id: "creator-month", name: "Content creator (monthly)", group: "Crew", rate: 100_000, unit: "month" },
  { id: "director", name: "Dedicated director", group: "Crew", rate: 50_000, unit: "day" },
  { id: "drone-job", name: "Drone job", group: "Crew", rate: 50_000, unit: "job" },
];

export const quoteOnlyEquipment = [
  { id: "lighting-equipment", name: "Lighting equipment", detail: "Quoted to the event brief" },
  { id: "sound-equipment", name: "Additional sound equipment", detail: "Quoted to the event brief" },
  { id: "led-screens", name: "LED screens and video walls", detail: "Quoted to the event brief" },
  { id: "cranes", name: "Camera cranes", detail: "Quoted to the event brief" },
  { id: "red-cameras", name: "RED cameras", detail: "Quoted to the event brief" },
  { id: "dollies", name: "Camera dollies", detail: "Quoted to the event brief" },
 ] as const;

export const quoteOnlyCrew = [
  { id: "sound-engineering", name: "Sound engineer", detail: "Rate agreed per job" },
  { id: "lighting-engineering", name: "Lighting engineer", detail: "Rate agreed per job" },
  { id: "camera-operator", name: "Camera operator", detail: "Confirm operator coverage and scope" },
  { id: "switcher-operator", name: "Video switcher operator", detail: "Confirm operator coverage and scope" },
] as const;

export const customQuoteServices = [
  { id: "printing", name: "Printing · banners, flyers, backdrops", detail: "Ask D-Team on WhatsApp" },
  { id: "flagship", name: "Flagship production", detail: "Custom scope; proposed tiers need confirmation" },
  { id: "mega", name: "Mega / sports broadcast", detail: "Custom scope and quotation" },
  { id: "other-custom", name: "Other custom service", detail: "Software, network engineering, and related work" },
] as const;

export const kitPresets: Record<string, Record<string, number>> = {
  "kit-a-essential": { "camera-standard": 2, tripod: 2, "sound-card": 1, laptop: 1, battery: 4 },
  "kit-b-livestream": { "camera-standard": 4, tripod: 4, switcher: 1, laptop: 3, "capture-card": 2, transmitter: 2, "transmitter-stand": 2, router: 1, "sound-card": 1, "hdmi-short": 6, "hdmi-long": 4, splitter: 1, lan: 1, "usb-hub": 1, battery: 6 },
  "kit-c-full-production": { "fx30-body": 3, "fx30-lens": 1, drone: 1, gimbal: 2, tripod: 2, switcher: 1, router: 1, "hdmi-short": 10, "hdmi-long": 4, transmitter: 3, "transmitter-stand": 3, splitter: 2, "sound-card": 1, lan: 2, laptop: 5, "usb-hub": 2, battery: 8, "capture-card": 2, extension: 1, monitors: 2, ndi: 1 },
};

export const packageOptions: PackageOption[] = [
  {
    id: "kit-a-essential",
    name: "Kit A · Essential",
    summary: "A compact equipment setup for small indoor productions and simple recording.",
    bestFor: "Seminars, small meetings, interviews, and simple studio recordings.",
    features: ["2 standard Sony cameras", "2 tripods", "Sound card with cable", "Laptop", "4 extra batteries"],
    rateAmount: 75_000,
  },
  {
    id: "kit-b-livestream",
    name: "Kit B · Multi-camera livestream",
    summary: "A multi-camera switching and livestream setup for indoor events.",
    bestFor: "Church services, worship nights, conferences, and studio productions.",
    features: ["4 standard Sony cameras", "4 tripods", "8-input video switcher", "Capture cards and transmitters", "Airtel ODU router"],
    rateAmount: 302_000,
  },
  {
    id: "kit-c-full-production",
    name: "Kit C · Full production",
    summary: "A larger capture and live-output equipment setup for major productions.",
    bestFor: "Summits, rallies, concerts, and large event productions.",
    features: ["3 Sony FX30 camera bodies and 1 FX30 with lens", "Drone and 2 gimbals", "8-input video switcher", "Laptops, monitors, and capture cards", "NDI, graphics operation, mixer, and XLR cables included"],
    rateAmount: 565_000,
  },
];

export const productionFeeGuide = [
  { label: "Small event", detail: "Single venue · up to about 5 hours", rate: "₦100,000–₦200,000 flat" },
  { label: "Big event", detail: "Production fee", rate: "₦100,000 per hour" },
] as const;

export const individualEquipmentGuide = [
  { label: "Standard Sony camera (video streaming)", rate: "₦15,000 / day" },
  { label: "Sony FX30, body only", rate: "₦30,000 / day" },
  { label: "Sony FX30 with 70–200mm lens", rate: "₦55,000 / day" },
  { label: "Drone", rate: "₦50,000 / day" },
  { label: "Gimbal", rate: "₦25,000 / day" },
  { label: "Tripod", rate: "₦5,000 / day" },
  { label: "8-input video switcher", rate: "₦50,000 / day" },
  { label: "Laptop", rate: "₦10,000 / day" },
  { label: "Audio sound card with cable", rate: "₦5,000" },
  { label: "Extra battery", rate: "₦5,000 each" },
  { label: "Transmitter", rate: "₦15,000 each" },
  { label: "Transmitter stand", rate: "₦4,000 each" },
  { label: "Capture card", rate: "₦3,000 each" },
  { label: "Splitter", rate: "₦5,000 each" },
  { label: "USB hub", rate: "₦2,000 each" },
  { label: "HDMI cable (10m or 30m)", rate: "₦5,000 each" },
  { label: "Short HDMI cable", rate: "₦2,000 each" },
  { label: "LAN cable (30m)", rate: "₦4,000" },
  { label: "Airtel ODU router", rate: "₦20,000 / day" },
  { label: "Extension cords and dummy batteries set", rate: "₦20,000" },
  { label: "PGM and multiview monitors", rate: "Included" },
  { label: "NDI, graphics operation, audio mixer, and XLR cables", rate: "Included" },
] as const;

export const individualCrewGuide = [
  { label: "Photographer", day: "₦25,000 / day", month: "₦150,000 / month" },
  { label: "Graphic designer", day: "₦25,000 / day", month: "₦150,000 / month" },
  { label: "Content creator", day: "₦15,000 / video", month: "₦100,000 / month" },
  { label: "Dedicated director", day: "₦50,000 / day", month: "By quote" },
  { label: "Drone job", day: "₦50,000 / job", month: "By quote" },
] as const;

export const quotationPdfPath = "/D-TEAM%20Studio%20%E2%80%94%20Quotation%20Master.pdf";

export function formatGuideRate(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
