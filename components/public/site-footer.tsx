import { CONTACT_TEL_URL, CONTACT_TIKTOK_URL, CONTACT_WHATSAPP_URL, CONTACT_PHONE_DISPLAY } from "@/features/content/contact";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <a className="wordmark" href="/#top" aria-label="D-Team Studio home">
          D<span>—</span>TEAM<span className="wordmark-period">.</span>
        </a>
        <span className="footer-promise">IDEAS INTO IMPACT.</span>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <a href="/work">WORK</a>
        <a href="/packages">PACKAGES</a>
        <a href="/brochure">BROCHURE</a>
        <a href="/team">TEAM</a>
        <a href="/journal">JOURNAL</a>
        <a href="/socials">SOCIALS</a>
        <a href="/privacy">PRIVACY</a>
        <a href="/terms">TERMS</a>
      </nav>
      <div className="footer-socials">
        <a href={CONTACT_TIKTOK_URL} target="_blank" rel="noreferrer" aria-label="D-Team on TikTok">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 3c.3 2.1 1.6 3.6 3.5 3.9v2.6c-1.3.1-2.6-.3-3.7-1v6.1c0 3.2-2.6 5.8-5.8 5.8S4.7 17.8 4.7 14.6s2.6-5.8 5.8-5.8c.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.7 0-3 1.4-3 3.1s1.3 3.1 3 3.1 3-1.4 3-3.1V3h3z" /></svg>
        </a>
        <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Chat with D-Team on WhatsApp">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-1.3-.6-2.1-1.4-2.9-2.7-.1-.2 0-.4.1-.5l.6-.7c.1-.2.1-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.8.8-1 1.9-.7 3 .4 1.6 1.4 3 2.7 4.1 1.2 1 2.6 1.7 4.1 1.9 1 .2 2.1-.1 2.8-1 .2-.2.3-.5.3-.7v-.5c0-.2-.1-.4-.3-.5z" /></svg>
        </a>
        <a href={CONTACT_TEL_URL} aria-label={`Call D-Team on ${CONTACT_PHONE_DISPLAY}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5c.5 0 1 .3 1.2.8l1.4 3.2c.2.4.1.9-.2 1.2l-1.3 1.3a14 14 0 0 0 6.3 6.3l1.3-1.3c.3-.3.8-.4 1.2-.2l3.2 1.4c.5.2.8.7.8 1.2V20a1.5 1.5 0 0 1-1.6 1.5C10.4 21 3 13.6 2.5 5.1A1.5 1.5 0 0 1 4 3.5h2.6z" /></svg>
        </a>
      </div>
      <div className="footer-contact-links">
        <a className="footer-contact" href={CONTACT_WHATSAPP_URL} target="_blank" rel="noreferrer">WHATSAPP {CONTACT_PHONE_DISPLAY} ↗</a>
        <a className="footer-contact" href={CONTACT_TEL_URL}>CALL {CONTACT_PHONE_DISPLAY} ↗</a>
      </div>
      <span className="footer-copy">© D—TEAM STUDIO 2026</span>
    </footer>
  );
}
