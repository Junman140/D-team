import type { Metadata } from "next";
import { listSocialLinks } from "@/features/content/queries";
import { canPreviewContent } from "@/features/content/preview";
import { CONTACT_PHONE_DISPLAY, CONTACT_TIKTOK_URL, CONTACT_WHATSAPP_URL } from "@/features/content/contact";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Socials | D-Team Studio", description: "Official D-Team social channels." };

export default async function SocialsPage() {
  const preview = process.env.NODE_ENV === "development" || await canPreviewContent();
  const links = await listSocialLinks({ includeDrafts: preview });

  return (
    <main className="socials-page section-wrap" id="main-content">
      <p className="eyebrow">D—TEAM STUDIO · SOCIALS</p>
      <h1 data-reveal="mask">Follow the<br /><em>process.</em></h1>
      <p className="team-page-intro">Official channels, confirmed by the studio.</p>
      {preview && <span className="draft-tag">DRAFT PREVIEW · PUBLISHED LINKS ONLY IN PRODUCTION</span>}
      {links.length > 0 ? <div className="social-list">{links.map((link) => (
        <a href={link.url} target="_blank" rel="noreferrer" className="social-row" data-reveal key={link.id}>
          <span className="eyebrow">{link.status === "draft" ? "DRAFT" : "OFFICIAL"}</span>
          <strong>{link.platform}</strong>
          <span>{link.label || link.url}</span>
          <span aria-hidden="true">↗</span>
        </a>
      ))}</div> : <div className="social-list">
        <a href={CONTACT_TIKTOK_URL} target="_blank" rel="noreferrer" className="social-row" data-reveal>
          <span className="eyebrow"><span className="pulse-dot" aria-hidden="true" /> OFFICIAL</span>
          <strong>TikTok</strong>
          <span>@dynamicteam0</span>
          <span aria-hidden="true">↗</span>
        </a>
        <p className="asset-note">Other official channels will appear here once the studio confirms them.</p>
      </div>}
      <div className="social-cta">
        <p className="eyebrow">FASTEST REPLY</p>
        <div className="social-cta-row">
          <h2>Talk to the crew<br /><em>directly.</em></h2>
          <a className="contact-button contact-channel--whatsapp" href={CONTACT_WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp {CONTACT_PHONE_DISPLAY} <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </main>
  );
}
