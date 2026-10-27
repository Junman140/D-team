import type { Metadata } from "next";
import Link from "next/link";
import { Corners } from "@/components/public/corners";
import { RevealObserver } from "@/components/public/reveal-observer";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { WhatsAppFab } from "@/components/public/whatsapp-fab";

export const metadata: Metadata = {
  title: "Frame not found | D-Team Studio",
  description: "The page you were looking for is not here.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <RevealObserver />
      <SiteHeader />
      <main className="not-found-page section-wrap" id="main-content">
        <div className="not-found-inner" data-reveal>
          <Corners className="not-found-corners" />
          <p className="eyebrow"><span className="pulse-dot" aria-hidden="true" /> 404 · FRAME NOT FOUND</p>
          <h1 data-reveal="mask">This frame<br /><em>is missing.</em></h1>
          <p className="not-found-copy">The page may have moved, or the link was cut short. Start again from the work, the services, or the contact line.</p>
          <div className="not-found-actions">
            <Link className="contact-button" href="/">Back to home <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" href="/work">See the work <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="not-found-foot" aria-hidden="true">
            <span>D—TEAM STUDIO</span>
            <span>IDEAS INTO IMPACT.</span>
            <span>404 / LOST FRAME</span>
          </div>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}
