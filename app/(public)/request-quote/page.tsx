import type { Metadata } from "next";
import { InquiryForm } from "@/components/public/inquiry-form";
import { listServices } from "@/features/content/queries";
import { CONTACT_WHATSAPP_NUMBER } from "@/features/content/contact";

export const metadata: Metadata = {
  title: "Request a quote | D-Team Studio",
  description: "Share your production brief with D-Team and request a custom quote.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RequestQuotePage({ searchParams }: { searchParams: Promise<{ budget?: string; currency?: string; service?: string; scope?: string }> }) {
  const inquiriesEnabled = process.env.PUBLIC_INQUIRIES_ENABLED === "true";
  const services = (await listServices()).map(({ slug, name }) => ({ slug, name }));
  const params = await searchParams;
  const budget = Number(params.budget?.replace(/,/g, ""));
  const allowedCurrencies = new Set(["NGN", "USD", "GBP", "EUR"]);
  const currency = allowedCurrencies.has(params.currency ?? "") ? params.currency! : "NGN";
  const initialService = services.some((service) => service.slug === params.service) ? params.service! : "";
  const estimateScope = params.scope?.trim().slice(0, 2400);
  const initialDetails = [
    Number.isFinite(budget) && budget > 0 ? `Budget indication: ${currency} ${Math.round(budget).toLocaleString("en-NG")}. This is a planning estimate, subject to confirmation.` : "",
    estimateScope ? `Shopping list estimate:\n${estimateScope}` : "",
    "Project details: ",
  ].filter(Boolean).join("\n\n");
  const whatsappMessage = [
    "Hello D-Team, I would like to discuss a project quote.",
    Number.isFinite(budget) && budget > 0 ? `Planning estimate: ${currency} ${Math.round(budget).toLocaleString("en-NG")}.` : "",
    estimateScope ? `Estimate details:\n${estimateScope}` : "",
  ].filter(Boolean).join("\n\n");
  const whatsappHref = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <main className="quote-page section-wrap" id="main-content">
      <div className="quote-heading">
        <p className="eyebrow">D—TEAM STUDIO · PROJECT INQUIRY</p>
        <h1>What are you<br /><em>bringing to life?</em></h1>
        <p>{inquiriesEnabled ? "Share the essentials. We will use them to understand the brief and respond about scope and a custom quote." : "Contact D-Team directly on WhatsApp, or build an itemized estimate and send it with your inquiry."}</p>
        {inquiriesEnabled && <span className="draft-tag">PROJECT INQUIRY</span>}
      </div>
      {inquiriesEnabled ? (
        <InquiryForm services={services} initialDetails={initialDetails} initialService={initialService} />
      ) : (
        <div className="quote-unavailable" role="status">
          <span className="eyebrow">DIRECT INQUIRIES ARE OPEN</span>
          <h2>Let’s talk about<br /><em>your production.</em></h2>
          <p>The website form is being prepared. You can contact D-Team directly on WhatsApp now, or build an itemized estimate first and send the list from the rates page.</p>
          <div className="packages-cta-actions">
            <a className="contact-button" href={whatsappHref} target="_blank" rel="noreferrer">Message D-Team on WhatsApp <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="/packages#budget-builder">Build an itemized estimate <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      )}
    </main>
  );
}
