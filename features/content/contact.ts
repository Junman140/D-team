// Owner-supplied contact details (22 October 2026). WhatsApp is the same
// number. Invented details are forbidden here; update only with owner input.
export const CONTACT_WHATSAPP_NUMBER = "2347010676567";
export const CONTACT_PHONE_DISPLAY = "+234 701 067 6567";
export const CONTACT_PHONE_E164 = "+2347010676567";
export const CONTACT_WHATSAPP_URL = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello D Team, I have a project in mind.")}`;
export const CONTACT_TEL_URL = `tel:${CONTACT_PHONE_E164}`;
export const CONTACT_TIKTOK_URL = "https://www.tiktok.com/@dynamicteam0?lang=en";
export const CONTACT_TIKTOK_LABEL = "@dynamicteam0";

export const AGENCY_PILLARS = [
  { number: "01", name: "Excellence", text: "Setting a high standard in everything you do." },
  { number: "02", name: "Innovation", text: "Finding smarter, more effective ways to deliver media solutions." },
  { number: "03", name: "Creativity", text: "Turning ideas into compelling visual experiences." },
  { number: "04", name: "Quality", text: "Maintaining professional standards across every service." },
  { number: "05", name: "Delivery", text: "Executing every project reliably and effectively." },
] as const;
